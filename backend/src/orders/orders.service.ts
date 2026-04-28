import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddOrderItemDto, CompleteOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillStatus,
  IngredientMovementType,
  OrderType,
  TaxMode,
} from '../../generated/prisma';
import {
  normalizeIngredientUnit,
  toBaseQuantity,
} from '../inventory/inventory-units';

import { BillsService } from '../bills/bills.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billsService: BillsService,
  ) {}

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  async create(
    createOrderDto: CreateOrderDto,
    restaurantId: string,
    cashierId: string,
  ) {
    try {
      // 1. Validate serviceType
      const validTypes = ['DINE_IN', 'PICKUP', 'DELIVERY', 'IN_STORE'];
      if (!validTypes.includes(createOrderDto.serviceType)) {
        throw new BadRequestException(`Invalid serviceType: ${createOrderDto.serviceType}`);
      }

      // 2. Resume existing session if tableId provided (Requirement 2 & 3)
      if (createOrderDto.tableId) {
        const activeBill = await this.prisma.bill.findFirst({
          where: {
            tableId: createOrderDto.tableId,
            status: { in: ['OPEN', 'KOT_SENT', 'AWAITING_PAYMENT'] as any },
            restaurantId,
          }
        });

        if (activeBill) {
          return {
            id: activeBill.id,
            status: 'ACTIVE'
          };
        }
      }

      // 3. Create new session via BillsService (Requirement 8 - Status Automation)
      const bill = await this.billsService.createBill(restaurantId, cashierId, {
        orderType: createOrderDto.serviceType as any,
        tableId: createOrderDto.tableId,
        tableNumber: createOrderDto.tableNumber,
        // Add items if provided in initial request
      });

      // 4. Add items if provided
      if (createOrderDto.items && createOrderDto.items.length > 0) {
        for (const item of createOrderDto.items) {
          await this.billsService.addBillItem(bill.id, restaurantId, {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          });
        }
      }

      return {
        id: bill.id,
        status: 'ACTIVE'
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      console.error('[OrdersService] Error in createOrder:', error);
      throw new BadRequestException(error.message || 'Failed to initialize POS session');
    }
  }

  async addItem(orderId: string, restaurantId: string, dto: AddOrderItemDto) {
    return this.billsService.addBillItem(orderId, restaurantId, {
      menuItemId: dto.productId,
      quantity: dto.quantity,
    });
  }

  async sendToKitchen(orderId: string, restaurantId: string) {
    const result = await this.billsService.sendToKitchen(orderId, restaurantId);
    return result.bill;
  }

  async complete(
    orderId: string,
    restaurantId: string,
    performedById: string,
    _dto: CompleteOrderDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: {
          id: orderId,
          restaurantId,
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  recipeItems: true,
                },
              },
            },
          },
        },
      });

      if (!bill) {
        throw new NotFoundException('Order not found');
      }

      if (bill.status === BillStatus.PAID) {
        throw new BadRequestException('Order is already completed');
      }

      if (bill.status === BillStatus.VOIDED) {
        throw new BadRequestException('Voided order cannot be completed');
      }

      const deductionMap = new Map<string, number>();

      for (const item of bill.items) {
        const menuItem = item.menuItem;
        if (!menuItem || !menuItem.trackInventory) {
          continue;
        }

        if (!menuItem.recipeItems || menuItem.recipeItems.length === 0) {
          throw new BadRequestException(
            `Recipe is missing for tracked item: ${item.itemName}`,
          );
        }

        for (const recipeItem of menuItem.recipeItems) {
          const required = Number(recipeItem.quantity) * item.quantity;
          const current = deductionMap.get(recipeItem.ingredientId) || 0;
          deductionMap.set(recipeItem.ingredientId, current + required);
        }
      }

      const ingredientIds = Array.from(deductionMap.keys());
      const ingredients = ingredientIds.length
        ? await tx.ingredient.findMany({
            where: {
              restaurantId,
              id: { in: ingredientIds },
            },
          })
        : [];

      if (ingredients.length !== ingredientIds.length) {
        throw new BadRequestException(
          'Ingredient configuration is incomplete for this order',
        );
      }

      const insufficient: {
        ingredientId: string;
        name: string;
        required: number;
        available: number;
      }[] = [];
      for (const ingredient of ingredients) {
        const required = deductionMap.get(ingredient.id) || 0;
        const available = toBaseQuantity(
          this.toNumber(ingredient.quantity),
          ingredient.unit,
        );
        if (required > available) {
          insufficient.push({
            ingredientId: ingredient.id,
            name: ingredient.name,
            required,
            available,
          });
        }
      }

      if (insufficient.length > 0) {
        throw new BadRequestException({
          message: 'Insufficient ingredient stock to complete this order',
          insufficient,
        });
      }

      for (const ingredient of ingredients) {
        const required = deductionMap.get(ingredient.id) || 0;
        if (required <= 0) {
          continue;
        }

        const available = toBaseQuantity(
          this.toNumber(ingredient.quantity),
          ingredient.unit,
        );
        const quantityAfter = available - required;
        const baseUnit = normalizeIngredientUnit(ingredient.unit);
        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: { quantity: quantityAfter, unit: baseUnit },
        });

        await tx.ingredientMovement.create({
          data: {
            ingredientId: ingredient.id,
            restaurantId,
            type: IngredientMovementType.ORDER_DEDUCTION,
            quantityChange: -required,
            quantityAfter,
            reason: `Order #${bill.orderNumber} completion`,
            referenceId: bill.id,
            performedById,
          },
        });
      }

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: BillStatus.PAID,
          paidAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return {
        bill: updatedBill,
        stockDeductions: Array.from(deductionMap.entries()).map(
          ([ingredientId, quantity]) => ({ ingredientId, quantity }),
        ),
      };
    });
  }

  findAll(restaurantId: string) {
    return this.prisma.bill.findMany({
      where: { restaurantId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, restaurantId: string) {
    return this.billsService.findOne(id, restaurantId);
  }

  update(id: string, updateOrderDto: UpdateOrderDto, restaurantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.bill.findFirst({
        where: { id, restaurantId },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Order not found');
      }

      return tx.bill.update({
        where: { id },
        data: {
          tableNumber: updateOrderDto.tableNumber || undefined,
        },
      });
    });
  }

  remove(id: string, restaurantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.bill.findFirst({
        where: { id, restaurantId },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Order not found');
      }

      return tx.bill.update({
        where: { id },
        data: {
          status: BillStatus.VOIDED,
          voidedAt: new Date(),
        },
      });
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompleteOrderDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillStatus,
  IngredientMovementType,
  OrderType,
  TaxMode,
} from '../../generated/prisma';
import { normalizeIngredientUnit, toBaseQuantity } from '../inventory/inventory-units';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  async create(
    createOrderDto: CreateOrderDto,
    restaurantId: string,
    cashierId: string,
  ) {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must include at least one item');
    }

    const menuItemIds = Array.from(
      new Set(createOrderDto.items.map((item) => item.menuItemId)),
    );
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        id: { in: menuItemIds },
      },
      include: {
        category: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more order items are invalid');
    }

    const menuMap = new Map(menuItems.map((item) => [item.id, item]));
    let subtotalCents = 0;

    const lineItems = createOrderDto.items.map((item) => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) {
        throw new BadRequestException('Invalid menu item');
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException(
          'Item quantity must be a positive integer',
        );
      }

      const lineTotalCents = menuItem.priceInCents * quantity;
      subtotalCents += lineTotalCents;

      return {
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        categoryName: menuItem.category?.name || 'Uncategorized',
        unitPriceInCents: menuItem.priceInCents,
        quantity,
        lineTotalCents,
        notes: item.notes?.trim() || null,
      };
    });

    const orderNumber = await this.prisma.bill.count({
      where: { restaurantId },
    });

    return this.prisma.bill.create({
      data: {
        restaurantId,
        cashierId,
        orderNumber: orderNumber + 1,
        orderType: (createOrderDto.orderType as OrderType) || OrderType.DINE_IN,
        status: BillStatus.KOT_SENT,
        tableNumber: createOrderDto.tableNumber || null,
        subtotalCents,
        taxAmountCents: 0,
        totalCents: subtotalCents,
        taxMode: TaxMode.INCLUSIVE,
        taxRate: 0,
        kotSentAt: new Date(),
        items: {
          create: lineItems,
        },
      },
      include: {
        items: true,
      },
    });
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

  findOne(id: string, restaurantId: string) {
    return this.prisma.bill.findFirst({
      where: { id, restaurantId },
      include: {
        items: true,
      },
    });
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

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddOrderItemDto,
  CompleteOrderDto,
  CreateOrderDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillStatus,
  IngredientMovementType,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  TaxMode,
  TableStatus,
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
        throw new BadRequestException(
          `Invalid serviceType: ${createOrderDto.serviceType}`,
        );
      }

      // 2. Resume existing session if tableId provided (Requirement 2 & 3)
      if (createOrderDto.tableId) {
        const activeBill = await this.prisma.bill.findFirst({
          where: {
            tableId: createOrderDto.tableId,
            status: { in: ['OPEN', 'KOT_SENT', 'AWAITING_PAYMENT'] as any },
            restaurantId,
          },
        });

        if (activeBill) {
          return {
            id: activeBill.id,
            status: 'ACTIVE',
          };
        }
      }

      // 3. Create new session via BillsService (Requirement 8 - Status Automation)
      const pickupName =
        createOrderDto.pickupName ??
        (createOrderDto.serviceType === 'PICKUP'
          ? createOrderDto.customerName
          : undefined);
      const pickupPhone =
        createOrderDto.pickupPhone ??
        (createOrderDto.serviceType === 'PICKUP'
          ? createOrderDto.customerPhone
          : undefined);

      const deliveryName =
        createOrderDto.deliveryName ??
        (createOrderDto.serviceType === 'DELIVERY'
          ? createOrderDto.customerName
          : undefined);
      const deliveryPhone =
        createOrderDto.deliveryPhone ??
        (createOrderDto.serviceType === 'DELIVERY'
          ? createOrderDto.customerPhone
          : undefined);
      const deliveryAddress =
        createOrderDto.deliveryAddress ??
        (createOrderDto.serviceType === 'DELIVERY'
          ? createOrderDto.customerAddress
          : undefined);

      const bill = await this.billsService.createBill(restaurantId, cashierId, {
        orderType: createOrderDto.serviceType as any,
        tableId: createOrderDto.tableId,
        tableNumber: createOrderDto.tableNumber,
        customerName: createOrderDto.customerName,
        customerPhone: createOrderDto.customerPhone,
        pickupName,
        pickupPhone,
        pickupTime: createOrderDto.pickupTime,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        deliverySuburb: createOrderDto.deliverySuburb,
        deliveryState: createOrderDto.deliveryState,
        deliveryPostcode: createOrderDto.deliveryPostcode,
        deliveryNotes: createOrderDto.deliveryNotes,
        deliveryPaymentMethod: createOrderDto.paymentType,
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
        status: 'ACTIVE',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      console.error(
        '[OrdersService] Error in createOrder:',
        error?.message || error,
      );
      throw new BadRequestException(
        error.message || 'Failed to initialize POS session',
      );
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

      // Inventory Deduction (CRITICAL Requirement)
      await this.billsService.deductInventoryForBill(tx, bill.id, restaurantId);

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

      // If a table is associated, update its status to OCCUPIED and start timer (Requirement: Override)
      if (updatedBill.tableId) {
        await tx.table.update({
          where: { id: updatedBill.tableId, restaurantId },
          data: {
            status: TableStatus.OCCUPIED,
            activeBillId: updatedBill.id,
            currentOrderId: updatedBill.id,
            startedAt: new Date(),
          },
        });
      }

      // KOT TRIGGER: Dine-In and In-Store should only be sent to kitchen AFTER payment
      if (
        (updatedBill.orderType === OrderType.DINE_IN ||
          updatedBill.orderType === OrderType.IN_STORE) &&
        !updatedBill.kotSentAt
      ) {
        await this.billsService.sendToKitchen(updatedBill.id, restaurantId);
      }

      return {
        bill: updatedBill,
      };
    });
  }

  async findAll(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bills = await this.prisma.bill.findMany({
      where: {
        restaurantId,
        OR: [
          {
            status: {
              in: [
                BillStatus.OPEN,
                BillStatus.KOT_SENT,
                BillStatus.AWAITING_PAYMENT,
              ],
            },
          },
          {
            status: { in: [BillStatus.PAID, BillStatus.CLOSED] },
            createdAt: { gte: today },
          },
        ],
      },
      include: {
        items: true,
        payments: {
          where: { status: PaymentStatus.APPROVED },
        },
        table: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bills.map((bill) => {
      const totalCents = bill.totalCents || 0;
      const paidCents = bill.payments.reduce(
        (sum, p) => sum + p.amountCents,
        0,
      );
      const remainingCents = Math.max(0, totalCents - paidCents);

      // Map internal BillStatus to User-requested status strings
      let statusString = 'CREATED';
      if (bill.status === BillStatus.KOT_SENT) statusString = 'IN_PROGRESS';
      if (bill.status === BillStatus.AWAITING_PAYMENT) statusString = 'BILLING';
      if (bill.status === BillStatus.PAID) statusString = 'COMPLETED';
      if (bill.status === BillStatus.CLOSED) statusString = 'CLOSED';

      return {
        id: bill.id,
        orderNumber: bill.orderNumber,
        orderType: bill.orderType,
        status: statusString,
        totalAmount: totalCents / 100,
        paidAmount: paidCents / 100,
        remainingAmount: remainingCents / 100,
        table: bill.table
          ? {
              id: bill.table.id,
              name: bill.table.name,
              floor: bill.table.floor,
            }
          : null,
        customerName:
          bill.customerName ||
          bill.customer?.name ||
          bill.deliveryName ||
          bill.pickupName ||
          null,
        customerPhone:
          bill.customerPhone ||
          bill.customer?.phone ||
          bill.deliveryPhone ||
          bill.pickupPhone ||
          null,
        deliveryAddress: bill.deliveryAddress,
        deliveryPaymentMethod: bill.deliveryPaymentMethod,
        itemCount: bill.items.length,
        createdAt: bill.createdAt,
      };
    });
  }

  async findOne(id: string, restaurantId: string) {
    return this.billsService.findOne(id, restaurantId);
  }

  async pay(id: string, restaurantId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id, restaurantId },
        include: { payments: { where: { status: PaymentStatus.APPROVED } } },
      });

      if (!bill) throw new NotFoundException('Order not found');

      const amountCents = Math.round(amount * 100);

      await tx.payment.create({
        data: {
          billId: id,
          amountCents,
          method: PaymentMethod.CASH,
          status: PaymentStatus.APPROVED,
          processedAt: new Date(),
        },
      });

      const totalPaidCents =
        bill.payments.reduce((sum, p) => sum + p.amountCents, 0) + amountCents;
      const isFullyPaid = totalPaidCents >= (bill.totalCents || 0);

      const updatedBill = await tx.bill.update({
        where: { id },
        data: {
          status: isFullyPaid ? BillStatus.PAID : BillStatus.AWAITING_PAYMENT,
          paidAt: isFullyPaid ? new Date() : undefined,
        },
      });

      return updatedBill;
    });
  }

  async close(id: string, restaurantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id, restaurantId },
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

      if (!bill) throw new NotFoundException('Order not found');

      // Deduct inventory if not already paid (to avoid double deduction if pay was called first)
      if (bill.status !== BillStatus.PAID) {
        await this.billsService.deductInventoryForBill(
          tx,
          bill.id,
          restaurantId,
        );
      }

      // Update Bill status to CLOSED (Archived from dashboard)
      await tx.bill.update({
        where: { id },
        data: {
          status: BillStatus.CLOSED,
          paidAt: bill.paidAt || new Date(),
        },
      });

      // If a table is associated, reset it to AVAILABLE and STOP timer
      if (bill.tableId) {
        await tx.table.update({
          where: { id: bill.tableId, restaurantId },
          data: {
            status: TableStatus.AVAILABLE,
            startedAt: null,
            activeBillId: null,
            currentOrderId: null,
          },
        });
      }

      return { success: true };
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
          customerName: updateOrderDto.customerName || undefined,
          customerPhone: updateOrderDto.customerPhone || undefined,
          tableNumber: updateOrderDto.tableNumber || undefined,
          pickupName: updateOrderDto.pickupName || undefined,
          pickupPhone: updateOrderDto.pickupPhone || undefined,
          pickupTime: updateOrderDto.pickupTime || undefined,
          deliveryName: updateOrderDto.deliveryName || undefined,
          deliveryPhone: updateOrderDto.deliveryPhone || undefined,
          deliveryAddress:
            updateOrderDto.deliveryAddress ||
            updateOrderDto.customerAddress ||
            undefined,
          deliverySuburb: updateOrderDto.deliverySuburb || undefined,
          deliveryState: updateOrderDto.deliveryState || undefined,
          deliveryPostcode: updateOrderDto.deliveryPostcode || undefined,
          deliveryNotes: updateOrderDto.deliveryNotes || undefined,
          deliveryPaymentMethod:
            (updateOrderDto.paymentType as any) || undefined,
        },
        include: {
          items: true,
          customer: true,
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

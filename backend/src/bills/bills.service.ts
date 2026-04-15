import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillStatus,
  KotStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TaxMode,
} from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddBillItemDto,
  CreateBillDto,
  UpdateBillItemDto,
} from './dto/create-bill.dto';
import { CashPaymentDto } from './dto/cash-payment.dto';

type BillItemSnapshot = {
  id: string;
  menuItemId: string | null;
  name: string;
  categoryName: string;
  quantity: number;
  price: number;
  lineTotal: number;
  notes: string | null;
};

type NormalizedBill = {
  id: string;
  orderNumber: number;
  orderType: OrderType;
  status: BillStatus;
  tableNumber: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  kotSentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  items: BillItemSnapshot[];
};

type KitchenOrderView = {
  id: string;
  billId: string;
  kotNumber: number;
  orderType: OrderType;
  status: KotStatus;
  isUpdate: boolean;
  sentAt: string;
  tableNumber: string | null;
  orderNumber: number;
  createdAt: string;
  items: BillItemSnapshot[];
};

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  private toCents(value: number): number {
    return Math.round(Number(value || 0) * 100);
  }

  private toAmount(value: number): number {
    return Number((value / 100).toFixed(2));
  }

  private isLockedStatus(status: BillStatus) {
    return (
      status === BillStatus.PAID ||
      status === BillStatus.VOIDED ||
      status === BillStatus.KOT_SENT
    );
  }

  private normalizeBill(bill: any): NormalizedBill {
    const items = Array.isArray(bill.items)
      ? bill.items.map((item: any) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.itemName,
          categoryName: item.categoryName,
          quantity: item.quantity,
          price: this.toAmount(item.unitPriceInCents),
          lineTotal: this.toAmount(item.lineTotalCents),
          notes: item.notes || null,
        }))
      : [];

    return {
      id: bill.id,
      orderNumber: bill.orderNumber,
      orderType: bill.orderType,
      status: bill.status,
      tableNumber: bill.tableNumber || null,
      subtotalAmount: this.toAmount(bill.subtotalCents || 0),
      taxAmount: this.toAmount(bill.taxAmountCents || 0),
      totalAmount: this.toAmount(bill.totalCents || 0),
      kotSentAt: bill.kotSentAt ? bill.kotSentAt.toISOString() : null,
      paidAt: bill.paidAt ? bill.paidAt.toISOString() : null,
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString(),
      itemCount: items.reduce(
        (sum: number, item: BillItemSnapshot) => sum + item.quantity,
        0,
      ),
      items,
    };
  }

  private normalizeKitchenOrders(orders: any[]): KitchenOrderView[] {
    return orders.map((order) => {
      const bill = order.bill;
      return {
        id: order.id,
        billId: order.billId,
        kotNumber: order.kotNumber,
        orderType: bill.orderType,
        status: order.status,
        isUpdate: order.isUpdate,
        sentAt: order.sentAt.toISOString(),
        tableNumber: bill.tableNumber || null,
        orderNumber: bill.orderNumber,
        createdAt: bill.createdAt.toISOString(),
        items: bill.items.map((item: any) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.itemName,
          categoryName: item.categoryName,
          quantity: item.quantity,
          price: this.toAmount(item.unitPriceInCents),
          lineTotal: this.toAmount(item.lineTotalCents),
          notes: item.notes || null,
        })),
      };
    });
  }

  private async createKotForBill(
    tx: Prisma.TransactionClient,
    bill: any,
  ) {
    if (bill.items.length === 0) {
      throw new BadRequestException('Add items before sending to kitchen');
    }

    if (bill.status === BillStatus.PAID || bill.status === BillStatus.VOIDED) {
      throw new BadRequestException(
        'Completed bills cannot be sent to kitchen',
      );
    }

    const kotCount = await tx.kitchenOrder.count({
      where: { billId: bill.id },
    });

    const kitchenOrder = await tx.kitchenOrder.create({
      data: {
        billId: bill.id,
        kotNumber: kotCount + 1,
        status: kotCount > 0 ? KotStatus.UPDATED : KotStatus.SENT,
        isUpdate: kotCount > 0,
      },
    });

    const updatedBill = await tx.bill.update({
      where: { id: bill.id },
      data: {
        status: BillStatus.KOT_SENT,
        kotSentAt: bill.kotSentAt || new Date(),
      },
      include: {
        items: true,
        kitchenOrders: true,
      },
    });

    return {
      bill: updatedBill,
      kitchenOrder,
    };
  }

  private async recalculateBillTotals(
    tx: Prisma.TransactionClient,
    billId: string,
  ) {
    const items = await tx.billItem.findMany({
      where: { billId },
      select: {
        lineTotalCents: true,
      },
    });

    const subtotalCents = items.reduce(
      (sum, item) => sum + Number(item.lineTotalCents || 0),
      0,
    );

    return tx.bill.update({
      where: { id: billId },
      data: {
        subtotalCents,
        taxAmountCents: 0,
        totalCents: subtotalCents,
      },
      include: {
        items: true,
        kitchenOrders: true,
      },
    });
  }

  async createBill(
    restaurantId: string,
    cashierId: string,
    dto: CreateBillDto,
  ) {
    const orderNumber = await this.prisma.bill.count({
      where: { restaurantId },
    });

    const bill = await this.prisma.bill.create({
      data: {
        restaurantId,
        cashierId,
        orderNumber: orderNumber + 1,
        orderType: (dto.orderType as OrderType) || OrderType.DINE_IN,
        status: BillStatus.OPEN,
        tableNumber: dto.tableNumber?.trim() || null,
        subtotalCents: 0,
        taxAmountCents: 0,
        totalCents: 0,
        taxMode: TaxMode.INCLUSIVE,
        taxRate: 0,
      },
      include: {
        items: true,
        kitchenOrders: true,
      },
    });

    return this.normalizeBill(bill);
  }

  async findAll(restaurantId: string, status?: string) {
    const bills = await this.prisma.bill.findMany({
      where: {
        restaurantId,
        ...(status
          ? { status: status as BillStatus }
          : {
              status: {
                in: [BillStatus.OPEN, BillStatus.KOT_SENT],
              },
            }),
      },
      include: {
        items: true,
        kitchenOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bills.map((bill) => this.normalizeBill(bill));
  }

  async findOne(id: string, restaurantId: string) {
    const bill = await this.prisma.bill.findFirst({
      where: { id, restaurantId },
      include: {
        items: true,
        kitchenOrders: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return this.normalizeBill(bill);
  }

  async addBillItem(billId: string, restaurantId: string, dto: AddBillItemDto) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, restaurantId },
        include: { items: true, kitchenOrders: true },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (this.isLockedStatus(bill.status)) {
        throw new BadRequestException('Bill can no longer be edited');
      }

      const quantity = Number(dto.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException('Quantity must be a positive integer');
      }

      const menuItem = await tx.menuItem.findFirst({
        where: {
          id: dto.menuItemId,
          restaurantId,
          isActive: true,
        },
        include: {
          category: true,
        },
      });

      if (!menuItem) {
        throw new NotFoundException('Menu item not found');
      }

      const existing = await tx.billItem.findFirst({
        where: {
          billId,
          menuItemId: dto.menuItemId,
        },
      });

      if (existing) {
        await tx.billItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            lineTotalCents: (existing.quantity + quantity) * menuItem.priceInCents,
          },
        });
      } else {
        await tx.billItem.create({
          data: {
            billId,
            menuItemId: menuItem.id,
            itemName: menuItem.name,
            categoryName: menuItem.category?.name || 'Uncategorized',
            unitPriceInCents: menuItem.priceInCents,
            quantity,
            lineTotalCents: menuItem.priceInCents * quantity,
            notes: dto.notes?.trim() || null,
          },
        });
      }

      const updatedBill = await this.recalculateBillTotals(tx, billId);
      return this.normalizeBill(updatedBill);
    });
  }

  async updateBillItem(
    billId: string,
    itemId: string,
    restaurantId: string,
    dto: UpdateBillItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, restaurantId },
        include: { items: true, kitchenOrders: true },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (this.isLockedStatus(bill.status)) {
        throw new BadRequestException('Bill can no longer be edited');
      }

      const currentItem = await tx.billItem.findFirst({
        where: {
          id: itemId,
          billId,
        },
      });

      if (!currentItem) {
        throw new NotFoundException('Bill item not found');
      }

      const nextQuantity = dto.quantity ?? currentItem.quantity;
      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
        throw new BadRequestException('Quantity must be a positive integer');
      }

      const nextNotes = dto.notes?.trim();

      await tx.billItem.update({
        where: { id: itemId },
        data: {
          quantity: nextQuantity,
          notes:
            nextNotes === undefined ? currentItem.notes : nextNotes || null,
          lineTotalCents: nextQuantity * currentItem.unitPriceInCents,
        },
      });

      const updatedBill = await this.recalculateBillTotals(tx, billId);
      return this.normalizeBill(updatedBill);
    });
  }

  async deleteBillItem(billId: string, itemId: string, restaurantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, restaurantId },
        include: { items: true, kitchenOrders: true },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      if (this.isLockedStatus(bill.status)) {
        throw new BadRequestException('Bill can no longer be edited');
      }

      const currentItem = await tx.billItem.findFirst({
        where: {
          id: itemId,
          billId,
        },
      });

      if (!currentItem) {
        throw new NotFoundException('Bill item not found');
      }

      await tx.billItem.delete({
        where: { id: itemId },
      });

      const updatedBill = await this.recalculateBillTotals(tx, billId);
      return this.normalizeBill(updatedBill);
    });
  }

  async sendToKitchen(billId: string, restaurantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, restaurantId },
        include: {
          items: true,
          kitchenOrders: true,
        },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      const { bill: updatedBill, kitchenOrder } = await this.createKotForBill(
        tx,
        bill,
      );

      return {
        bill: this.normalizeBill(updatedBill),
        kitchenOrder: {
          id: kitchenOrder.id,
          billId: kitchenOrder.billId,
          kotNumber: kitchenOrder.kotNumber,
          status: kitchenOrder.status,
          isUpdate: kitchenOrder.isUpdate,
          sentAt: kitchenOrder.sentAt.toISOString(),
        },
      };
    });
  }

  async getKitchenOrders(restaurantId: string) {
    const kitchenOrders = await this.prisma.kitchenOrder.findMany({
      where: {
        bill: {
          restaurantId,
        },
      },
      include: {
        bill: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return this.normalizeKitchenOrders(kitchenOrders);
  }

  async processCashPayment(restaurantId: string, dto: CashPaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const initialBill = await tx.bill.findFirst({
        where: {
          id: dto.billId,
          restaurantId,
        },
        include: {
          items: true,
          payments: true,
          kitchenOrders: true,
        },
      });

      if (!initialBill) {
        throw new NotFoundException('Bill not found');
      }

      if (initialBill.status === BillStatus.PAID) {
        throw new BadRequestException('Bill is already paid');
      }

      if (initialBill.items.length === 0) {
        throw new BadRequestException('Cannot pay a bill with no items');
      }

      let bill = initialBill;

      // Fallback: if KOT was skipped, automatically create one before payment.
      if (bill.status !== BillStatus.KOT_SENT) {
        await this.createKotForBill(tx, bill);
        const refreshedBill = await tx.bill.findFirst({
          where: {
            id: dto.billId,
            restaurantId,
          },
          include: {
            items: true,
            payments: true,
            kitchenOrders: true,
          },
        });

        if (!refreshedBill) {
          throw new NotFoundException('Bill not found after KOT creation');
        }

        bill = refreshedBill;
      }

      const totalAmount = this.toAmount(bill.totalCents || 0);
      const requestedAmount = Number(dto.amount);
      const cashReceived = Number(dto.cashReceived);

      if (Math.abs(requestedAmount - totalAmount) > 0.001) {
        throw new BadRequestException(
          'Payment amount must match the bill total',
        );
      }

      if (cashReceived < totalAmount) {
        throw new BadRequestException(
          'Cash received is less than the bill total',
        );
      }

      const payment = await tx.payment.create({
        data: {
          billId: bill.id,
          method: PaymentMethod.CASH,
          amountCents: this.toCents(totalAmount),
          status: PaymentStatus.APPROVED,
          cashTenderedCents: this.toCents(cashReceived),
          changeCents: this.toCents(cashReceived - totalAmount),
          processedAt: new Date(),
        },
      });

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: BillStatus.PAID,
          paidAt: new Date(),
        },
        include: {
          items: true,
          kitchenOrders: true,
          payments: true,
        },
      });

      return {
        bill: this.normalizeBill(updatedBill),
        payment: {
          id: payment.id,
          billId: payment.billId,
          method: payment.method,
          amount: this.toAmount(payment.amountCents),
          cashReceived,
          change: this.toAmount(payment.changeCents || 0),
          status: payment.status,
          processedAt: payment.processedAt?.toISOString() || null,
        },
      };
    });
  }
}

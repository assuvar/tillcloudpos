import {
  BadRequestException,
  ForbiddenException,
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
  TableStatus,
  IngredientMovementType,
} from '../../generated/prisma';
import {
  normalizeIngredientUnit,
  toBaseQuantity,
} from '../inventory/inventory-units';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddBillItemDto,
  CreateBillDto,
  UpdateBillItemDto,
} from './dto/create-bill.dto';
import { CashPaymentDto } from './dto/cash-payment.dto';
import { PrintingService } from '../settings/printing.service';
import { KotMode } from '../../generated/prisma';

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
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryPaymentMethod?: string | null;
  pickupName?: string | null;
  pickupPhone?: string | null;
  deliveryName?: string | null;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly printingService: PrintingService,
  ) {}

  private toClosedDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private async assertBillDateOpen(restaurantId: string, billDate: Date) {
    // LOCK REMOVED: System must continue working after close day.
    // Requirement 1 & 2: Close Day = Data Reset (NOT System Lock)
    return;
  }

  private async assertBillOwnership(billId: string, restaurantId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      select: { id: true, restaurantId: true },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    if (bill.restaurantId !== restaurantId) {
      throw new ForbiddenException('Cross-tenant bill access is forbidden');
    }
  }

  private async assertSufficientIngredientStockForBill(
    tx: Prisma.TransactionClient,
    restaurantId: string,
    billId: string,
  ) {
    const billItems = await tx.billItem.findMany({
      where: { billId },
      include: {
        menuItem: {
          include: {
            recipeItems: true,
          },
        },
      },
    });

    const requiredByIngredient = new Map<string, number>();

    for (const billItem of billItems) {
      const menuItem = billItem.menuItem;
      if (!menuItem?.trackInventory) {
        continue;
      }

      if (!menuItem.recipeItems || menuItem.recipeItems.length === 0) {
        throw new BadRequestException(
          `Recipe is missing for tracked item: ${billItem.itemName}`,
        );
      }

      for (const recipeItem of menuItem.recipeItems) {
        const needed = Number(recipeItem.quantity) * billItem.quantity;
        const current = requiredByIngredient.get(recipeItem.ingredientId) || 0;
        requiredByIngredient.set(recipeItem.ingredientId, current + needed);
      }
    }

    if (requiredByIngredient.size === 0) {
      return;
    }

    const ingredientIds = Array.from(requiredByIngredient.keys());
    const ingredients = await tx.ingredient.findMany({
      where: {
        restaurantId,
        id: { in: ingredientIds },
      },
      select: {
        id: true,
        name: true,
        quantity: true,
      },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException('Ingredient configuration is incomplete');
    }

    const insufficient = ingredients
      .map((ingredient) => {
        const required = requiredByIngredient.get(ingredient.id) || 0;
        const available = Number(ingredient.quantity || 0);
        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          required,
          available,
        };
      })
      .filter((entry) => entry.required > entry.available);

    // Allow negative stock (Requirement: Override constraint)
    /*
    if (insufficient.length > 0) {
      throw new BadRequestException({
        message: 'Insufficient ingredient stock for this bill',
        insufficient,
      });
    }
    */
  }

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
      // In a real system, the KOT itself should store the items it contains.
      // Since our schema doesn't have a KotItem, we'll assume for now that
      // the kitchen display wants to see all items but maybe we should only show the ones relevant to THIS KOT?
      // For now, let's keep it consistent with what createKotForBill does.
      return {
        id: order.id,
        billId: order.billId,
        kotNumber: order.kotNumber,
        orderType: bill.orderType,
        status: order.status,
        isUpdate: order.isUpdate,
        sentAt: order.sentAt.toISOString(),
        tableNumber: bill.tableNumber || bill.table?.name || null,
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

  private async createKotForBill(tx: Prisma.TransactionClient, bill: any) {
    const itemsToSend = bill.items.filter(
      (item: any) => item.quantity > (item.lastSentQuantity || 0),
    );

    if (itemsToSend.length === 0) {
      throw new BadRequestException(
        'All items have already been sent to the kitchen',
      );
    }

    if (bill.status === BillStatus.PAID || bill.status === BillStatus.VOIDED) {
      // Allow sending KOT for PAID bills if it's Dine-In/In-Store (since that's the rule)
      // but only if there are new items to send.
    } else {
      // For OPEN/AWAITING_PAYMENT, check if it's allowed
      if (
        bill.orderType === OrderType.DINE_IN ||
        bill.orderType === OrderType.IN_STORE
      ) {
        throw new BadRequestException(
          'KOT for Dine-In and In-Store orders can only be triggered after payment is completed.',
        );
      }
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

    // Update lastSentQuantity for all items
    for (const item of updatedBill.items) {
      if (item.quantity > item.lastSentQuantity) {
        await tx.billItem.update({
          where: { id: item.id },
          data: { lastSentQuantity: item.quantity },
        });
      }
    }

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
    await this.assertBillDateOpen(restaurantId, new Date());

    // Calculate order numbers
    const totalOrderCount = await this.prisma.bill.count({
      where: { restaurantId },
    });

    // Find the latest day closure to reset displayOrderNumber
    const latestClosure = await this.prisma.dayClosure.findFirst({
      where: { restaurantId },
      orderBy: { closedDate: 'desc' },
    });

    const displayOrderCount = await this.prisma.bill.count({
      where: {
        restaurantId,
        createdAt: {
          gte: latestClosure ? latestClosure.createdAt : new Date(0),
        },
      },
    });

    // Auto-resolve table name if tableId is provided but tableNumber is not
    let resolvedTableNumber = dto.tableNumber?.trim() || null;
    if (dto.tableId && !resolvedTableNumber) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (table) resolvedTableNumber = table.name;
    }

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          restaurantId,
          cashierId,
          orderNumber: totalOrderCount + 1,
          displayOrderNumber: displayOrderCount + 1,
          orderType: (dto.orderType as OrderType) || OrderType.DINE_IN,
          status: BillStatus.OPEN,
          tableId: dto.tableId || null,
          tableNumber: resolvedTableNumber,
          customerName: dto.customerName || null,
          customerPhone: dto.customerPhone || null,

          // New Pickup/Delivery fields
          pickupName: dto.pickupName || null,
          pickupPhone: dto.pickupPhone || null,
          pickupTime: dto.pickupTime || null,
          deliveryName: dto.deliveryName || null,
          deliveryAddress: dto.deliveryAddress || null,
          deliverySuburb: dto.deliverySuburb || null,
          deliveryState: dto.deliveryState || null,
          deliveryPostcode: dto.deliveryPostcode || null,
          deliveryPhone: dto.deliveryPhone || null,
          deliveryNotes: dto.deliveryNotes || null,
          deliveryPaymentMethod: (dto.deliveryPaymentMethod as any) || null,

          subtotalCents: 0,
          taxAmountCents: 0,
          totalCents: 0,
          taxMode: TaxMode.INCLUSIVE,
          taxRate: new Prisma.Decimal(0),
        },
        include: {
          items: true,
          kitchenOrders: true,
        },
      });

      // If a table is associated, update its table reference but DO NOT mark as OCCUPIED yet (Requirement: Override)
      if (dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId, restaurantId },
          data: {
            // status: TableStatus.OCCUPIED, // DO NOT mark occupied yet
            activeBillId: bill.id,
            currentOrderId: bill.id,
            // startedAt: new Date(), // DO NOT start timer yet
          },
        });
      }

      return this.normalizeBill(bill);
    });
  }

  async findAll(restaurantId: string, status?: string, limit?: number) {
    const take = Number.isFinite(limit)
      ? Math.min(Math.max(Number(limit), 1), 100)
      : undefined;

    const where = {
      restaurantId,
      ...(status
        ? { status: status as BillStatus }
        : take
          ? {}
          : {
              status: {
                in: [
                  BillStatus.OPEN,
                  BillStatus.KOT_SENT,
                  BillStatus.PREPARING,
                  BillStatus.READY,
                  BillStatus.AWAITING_PAYMENT,
                ],
              },
            }),
    };

    const bills = await this.prisma.bill.findMany({
      where,
      include: {
        items: true,
        kitchenOrders: true,
        table: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return bills.map((bill) => this.normalizeBill(bill));
  }

  async findOne(id: string, restaurantId: string) {
    await this.assertBillOwnership(id, restaurantId);

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
    await this.assertBillOwnership(billId, restaurantId);

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

      await this.assertBillDateOpen(restaurantId, bill.createdAt);

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
            lineTotalCents:
              (existing.quantity + quantity) * menuItem.priceInCents,
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

      await this.assertSufficientIngredientStockForBill(
        tx,
        restaurantId,
        billId,
      );

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
    await this.assertBillOwnership(billId, restaurantId);

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

      await this.assertBillDateOpen(restaurantId, bill.createdAt);

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

      await this.assertSufficientIngredientStockForBill(
        tx,
        restaurantId,
        billId,
      );

      const updatedBill = await this.recalculateBillTotals(tx, billId);
      return this.normalizeBill(updatedBill);
    });
  }

  async deleteBillItem(billId: string, itemId: string, restaurantId: string) {
    await this.assertBillOwnership(billId, restaurantId);

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

      await this.assertBillDateOpen(restaurantId, bill.createdAt);

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
    await this.assertBillOwnership(billId, restaurantId);

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

      await this.assertBillDateOpen(restaurantId, bill.createdAt);

      // Stock validation disabled
      /*
      await this.assertSufficientIngredientStockForBill(
        tx,
        restaurantId,
        billId,
      );
      */

      const { bill: updatedBill, kitchenOrder } = await this.createKotForBill(
        tx,
        bill,
      );

      // Requirement: Timer should start when order is sent to kitchen
      if (bill.tableId) {
        await tx.table.update({
          where: { id: bill.tableId, restaurantId },
          data: {
            status: TableStatus.OCCUPIED,
            startedAt: bill.kotSentAt || new Date(),
          },
        });
      }

      // Requirement: Handle KOT Mode (Print/Display)
      const kotSettings = await tx.kotSettings.findUnique({
        where: { restaurantId },
      });

      const mode = kotSettings?.mode || 'BOTH';
      const enablePrinting = kotSettings?.enablePrinting ?? true;

      // Trigger Print if enabled (Non-blocking)
      if (enablePrinting && (mode === 'PRINT' || mode === 'BOTH')) {
        this.printingService
          .triggerKotPrint(restaurantId, kitchenOrder.id)
          .catch((err) => console.error('KOT Print failed', err));
      }

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
            table: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return this.normalizeKitchenOrders(kitchenOrders);
  }

  async updateKitchenOrderStatus(
    restaurantId: string,
    orderId: string,
    status: string,
  ) {
    const kitchenOrder = await this.prisma.kitchenOrder.findFirst({
      where: {
        id: orderId,
        bill: {
          restaurantId,
        },
      },
    });

    if (!kitchenOrder) {
      throw new NotFoundException('Kitchen order not found');
    }

    const nextStatus = status as KotStatus;
    const data: Prisma.KitchenOrderUpdateInput = { status: nextStatus };

    if (nextStatus === KotStatus.READY) {
      data.readyAt = new Date();
    } else if (
      nextStatus === KotStatus.BUMPED ||
      nextStatus === KotStatus.COMPLETED
    ) {
      data.bumpedAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.kitchenOrder.update({
        where: { id: orderId },
        data,
        include: {
          bill: {
            include: {
              items: true,
            },
          },
        },
      });

      // Synchronize with Bill status if not already PAID or CLOSED
      const currentBillStatus = updatedOrder.bill.status;
      if (
        currentBillStatus !== BillStatus.PAID &&
        currentBillStatus !== BillStatus.CLOSED &&
        currentBillStatus !== BillStatus.VOIDED
      ) {
        let newBillStatus: BillStatus | undefined;

        if (nextStatus === KotStatus.PREPARING) {
          newBillStatus = BillStatus.PREPARING;
        } else if (nextStatus === KotStatus.READY) {
          newBillStatus = BillStatus.READY;
        } else if (
          nextStatus === KotStatus.COMPLETED ||
          nextStatus === KotStatus.BUMPED
        ) {
          // Check if all other kitchen orders for this bill are also done
          const allKots = await tx.kitchenOrder.findMany({
            where: { billId: updatedOrder.billId },
          });
          const allDone = allKots.every(
            (k) =>
              k.status === KotStatus.COMPLETED || k.status === KotStatus.BUMPED,
          );

          if (allDone && updatedOrder.bill.status === BillStatus.PAID) {
            await tx.bill.update({
              where: { id: updatedOrder.billId },
              data: {
                status: BillStatus.CLOSED,
                paidAt: updatedOrder.bill.paidAt || new Date(),
              },
            });

            if (updatedOrder.bill.tableId) {
              await tx.table.update({
                where: {
                  id: updatedOrder.bill.tableId,
                  restaurantId: updatedOrder.bill.restaurantId,
                },
                data: {
                  status: TableStatus.AVAILABLE,
                  activeBillId: null,
                  currentOrderId: null,
                  startedAt: null,
                },
              });
            }
          }
        }

        if (newBillStatus && newBillStatus !== currentBillStatus) {
          await tx.bill.update({
            where: { id: updatedOrder.billId },
            data: { status: newBillStatus },
          });
        }
      }

      return updatedOrder;
    });
  }

  async processCashPayment(restaurantId: string, dto: CashPaymentDto) {
    await this.assertBillOwnership(dto.billId, restaurantId);

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
      const isDineInOrInStore =
        bill.orderType === OrderType.DINE_IN ||
        bill.orderType === OrderType.IN_STORE;

      // For Pickup/Delivery: auto-create KOT before payment if not already sent.
      // For Dine-In/In-Store: skip pre-payment KOT (it must happen AFTER payment).
      if (bill.status !== BillStatus.KOT_SENT && !isDineInOrInStore) {
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

      let updatedBill = await tx.bill.update({
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

      const allDone =
        updatedBill.kitchenOrders.length > 0 &&
        updatedBill.kitchenOrders.every(
          (k) =>
            k.status === KotStatus.COMPLETED || k.status === KotStatus.BUMPED,
        );

      if (allDone) {
        updatedBill = await tx.bill.update({
          where: { id: bill.id },
          data: {
            status: BillStatus.CLOSED,
          },
          include: {
            items: true,
            kitchenOrders: true,
            payments: true,
          },
        });

        if (updatedBill.tableId) {
          await tx.table.update({
            where: { id: updatedBill.tableId, restaurantId },
            data: {
              status: TableStatus.AVAILABLE,
              activeBillId: null,
              currentOrderId: null,
              startedAt: null,
            },
          });
        }
      } else if (isDineInOrInStore && updatedBill.kitchenOrders.length === 0) {
        // For Dine-In/In-Store: NOW create KOT after payment is recorded
        await this.createKotForBill(tx, updatedBill);
        updatedBill = await tx.bill.findFirstOrThrow({
          where: { id: bill.id, restaurantId },
          include: {
            items: true,
            kitchenOrders: true,
            payments: true,
          },
        });

        // Trigger KOT Print for Dine-In/In-Store (Non-blocking)
        if (updatedBill.kitchenOrders.length > 0) {
          const lastKot =
            updatedBill.kitchenOrders[updatedBill.kitchenOrders.length - 1];
          this.printingService
            .triggerKotPrint(restaurantId, lastKot.id)
            .catch((err) => console.error('KOT Print failed', err));
        }
      }

      // Inventory Deduction (CRITICAL Requirement)
      await this.deductInventoryForBill(tx, bill.id, restaurantId);

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

      // Trigger Bill Print (Non-blocking)
      this.printingService
        .triggerBillPrint(restaurantId, updatedBill.id)
        .catch((err) => console.error('Bill Print failed', err));

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

  async deductInventoryForBill(
    tx: Prisma.TransactionClient,
    billId: string,
    restaurantId: string,
  ) {
    const bill = await tx.bill.findUnique({
      where: { id: billId },
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

    if (!bill) return;

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
    if (ingredientIds.length === 0) return;

    const ingredients = await tx.ingredient.findMany({
      where: {
        restaurantId,
        id: { in: ingredientIds },
      },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException('Ingredient configuration is incomplete');
    }

    for (const ingredient of ingredients) {
      const required = deductionMap.get(ingredient.id) || 0;
      // Get current available in base units
      const available = toBaseQuantity(
        Number(ingredient.quantity),
        ingredient.unit,
      );

      // Allow negative stock (Requirement: Override constraint)
      // Removed: if (required > available) { ... throw Insufficient stock ... }

      const quantityAfter = available - required;
      const baseUnit = normalizeIngredientUnit(ingredient.unit);

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: {
          quantity: quantityAfter,
          unit: baseUnit,
        },
      });

      await tx.ingredientMovement.create({
        data: {
          ingredientId: ingredient.id,
          restaurantId,
          type: IngredientMovementType.ORDER_DEDUCTION,
          quantityChange: -required,
          quantityAfter,
          reason: `Bill #${bill.orderNumber} payment`,
          referenceId: bill.id,
        },
      });
    }
  }
}

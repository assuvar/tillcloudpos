import { Injectable } from '@nestjs/common';
import { BillStatus, TableStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

type CloseDayOptions = {
  businessDate?: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private toAmount(cents: number | null | undefined): number {
    return Number(((Number(cents || 0) || 0) / 100).toFixed(2));
  }

  private getUtcDayBounds(dateInput?: string) {
    const date = dateInput ? new Date(dateInput) : new Date();
    const source = Number.isNaN(date.getTime()) ? new Date() : date;

    const start = new Date(
      Date.UTC(
        source.getUTCFullYear(),
        source.getUTCMonth(),
        source.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return {
      start,
      end,
      closedDate: start,
      dateKey: start.toISOString().slice(0, 10),
    };
  }

  async getSummary(restaurantId: string) {
    const { start, end } = this.getUtcDayBounds();

    const [ordersCount, paidAgg, openOrdersCount, lowStockRows] =
      await Promise.all([
        this.prisma.bill.count({
          where: {
            restaurantId,
            createdAt: { gte: start, lt: end },
          },
        }),
        this.prisma.bill.aggregate({
          where: {
            restaurantId,
            status: BillStatus.PAID,
            createdAt: { gte: start, lt: end },
          },
          _sum: {
            totalCents: true,
          },
          _count: {
            _all: true,
          },
        }),
        this.prisma.bill.count({
          where: {
            restaurantId,
            status: {
              in: [
                BillStatus.OPEN,
                BillStatus.KOT_SENT,
                BillStatus.AWAITING_PAYMENT,
              ],
            },
            createdAt: { gte: start, lt: end },
          },
        }),
        this.prisma.ingredient.findMany({
          where: {
            restaurantId,
          },
          select: {
            quantity: true,
            lowStockThreshold: true,
          },
        }),
      ]);

    const lowStockCount = lowStockRows.filter(
      (row) => Number(row.quantity || 0) <= Number(row.lowStockThreshold || 0),
    ).length;

    const paidOrders = paidAgg._count._all || 0;
    const revenue = this.toAmount(paidAgg._sum.totalCents);

    return {
      revenue,
      orders: ordersCount,
      avgOrderValue:
        paidOrders > 0 ? Number((revenue / paidOrders).toFixed(2)) : 0,
      paidOrders,
      openOrders: openOrdersCount,
      lowStockItems: lowStockCount,
      currency: 'AUD',
      period: {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      },
    };
  }

  async getAnalytics(restaurantId: string) {
    const today = this.getUtcDayBounds().start;
    const periodStart = new Date(today);
    periodStart.setUTCDate(periodStart.getUTCDate() - 6);

    const [bills, billItems] = await Promise.all([
      this.prisma.bill.findMany({
        where: {
          restaurantId,
          createdAt: { gte: periodStart },
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          totalCents: true,
        },
      }),
      this.prisma.billItem.findMany({
        where: {
          bill: {
            restaurantId,
            createdAt: { gte: periodStart },
          },
        },
        select: {
          itemName: true,
          categoryName: true,
          quantity: true,
          lineTotalCents: true,
        },
      }),
    ]);

    const dayMap = new Map<
      string,
      { date: string; revenue: number; orders: number }
    >();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(periodStart);
      day.setUTCDate(periodStart.getUTCDate() + i);
      const key = day.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, revenue: 0, orders: 0 });
    }

    bills.forEach((bill) => {
      const key = bill.createdAt.toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) {
        return;
      }

      bucket.orders += 1;
      if (bill.status === BillStatus.PAID) {
        bucket.revenue += this.toAmount(bill.totalCents);
      }
    });

    const itemMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    const categoryMap = new Map<
      string,
      { category: string; quantity: number; revenue: number }
    >();

    billItems.forEach((row) => {
      const currentItem = itemMap.get(row.itemName) || {
        name: row.itemName,
        quantity: 0,
        revenue: 0,
      };
      currentItem.quantity += Number(row.quantity || 0);
      currentItem.revenue += this.toAmount(row.lineTotalCents);
      itemMap.set(row.itemName, currentItem);

      const category = row.categoryName || 'Uncategorized';
      const currentCategory = categoryMap.get(category) || {
        category,
        quantity: 0,
        revenue: 0,
      };
      currentCategory.quantity += Number(row.quantity || 0);
      currentCategory.revenue += this.toAmount(row.lineTotalCents);
      categoryMap.set(category, currentCategory);
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const categorySales = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    const revenueTrend = Array.from(dayMap.values()).map((row) => ({
      date: row.date,
      value: Number(row.revenue.toFixed(2)),
    }));

    const ordersTrend = Array.from(dayMap.values()).map((row) => ({
      date: row.date,
      value: row.orders,
    }));

    return {
      range: {
        startAt: periodStart.toISOString(),
        endAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
      revenueTrend,
      ordersTrend,
      topItems,
      categorySales,
    };
  }

  async closeDay(
    restaurantId: string,
    _closedByUserId: string | null,
    options: CloseDayOptions = {},
  ) {
    const { start, end, closedDate, dateKey } = this.getUtcDayBounds(
      options.businessDate,
    );

    const [billsCount, paidAgg] = await Promise.all([
      this.prisma.bill.count({
        where: {
          restaurantId,
          createdAt: { gte: start, lt: end },
        },
      }),
      this.prisma.bill.aggregate({
        where: {
          restaurantId,
          status: BillStatus.PAID,
          createdAt: { gte: start, lt: end },
        },
        _sum: {
          totalCents: true,
        },
      }),
    ]);

    const totalRevenue = this.toAmount(paidAgg._sum.totalCents);

    const closure = await this.prisma.$transaction(async (tx) => {
      // 1. Mark all today's active bills for this restaurant as CLOSED
      // This effectively clears the "Open Bills" dashboard.
      await tx.bill.updateMany({
        where: {
          restaurantId,
          createdAt: { gte: start, lt: end },
          status: {
            in: [
              BillStatus.OPEN,
              BillStatus.KOT_SENT,
              BillStatus.AWAITING_PAYMENT,
              BillStatus.PAID,
            ],
          },
        },
        data: {
          status: BillStatus.CLOSED,
        },
      });

      // 2. Reset ALL tables to AVAILABLE and stop timers
      // This handles Requirement 1 & 5 (Table Reset Logic)
      await tx.table.updateMany({
        where: {
          restaurantId,
        },
        data: {
          status: TableStatus.AVAILABLE,
          activeBillId: null,
          currentOrderId: null,
          startedAt: null,
        },
      });

      // 3. Create or update the closure record
      return tx.dayClosure.upsert({
        where: {
          restaurantId_closedDate: {
            restaurantId,
            closedDate,
          },
        },
        create: {
          restaurantId,
          closedDate,
          totalRevenue,
          totalOrders: billsCount,
        },
        update: {
          totalRevenue,
          totalOrders: billsCount,
        },
      });
    });

    return {
      success: true,
      businessDate: dateKey,
      closedAt: closure.createdAt.toISOString(),
      billsCount,
      revenue: totalRevenue,
    };
  }

  async exportCsv(restaurantId: string) {
    const { start, end, dateKey } = this.getUtcDayBounds();
    const bills = await this.prisma.bill.findMany({
      where: {
        restaurantId,
        createdAt: { gte: start, lt: end },
      },
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        status: true,
        createdAt: true,
        paidAt: true,
        totalCents: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const header =
      'billId,orderNumber,orderType,status,createdAt,paidAt,totalAmount\n';
    const rows = bills
      .map((bill) => {
        const amount = this.toAmount(bill.totalCents).toFixed(2);
        const paidAt = bill.paidAt ? bill.paidAt.toISOString() : '';
        return [
          bill.id,
          bill.orderNumber,
          bill.orderType,
          bill.status,
          bill.createdAt.toISOString(),
          paidAt,
          amount,
        ].join(',');
      })
      .join('\n');

    return {
      filename: `report-${dateKey}.csv`,
      content: `${header}${rows}${rows ? '\n' : ''}`,
    };
  }
}

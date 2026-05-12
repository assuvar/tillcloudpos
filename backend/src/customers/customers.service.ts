import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, query: any) {
    const { period, minSpent, frequent, customerType } = query;
    let dateFilter = {};
    if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { lastVisitAt: { gte: startOfMonth } };
    }

    const where: Prisma.CustomerWhereInput = { restaurantId, ...dateFilter };
    if (minSpent) {
      where.totalSpentCents = { gte: parseInt(minSpent, 10) * 100 };
    }
    if (frequent === 'true') {
      where.totalVisits = { gte: 5 }; // Define frequent as >= 5 visits
    }
    if (customerType === 'DELIVERY' || customerType === 'PICKUP' || customerType === 'DINE_IN' || customerType === 'IN_STORE') {
      where.bills = {
        some: {
          orderType: customerType,
          status: { in: ['PAID', 'CLOSED'] },
        },
      };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { lastVisitAt: 'desc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCustomers = await this.prisma.customer.count({
      where: {
        restaurantId,
        createdAt: { gte: today },
      },
    });

    const todayVisitors = await this.prisma.bill.count({
      where: {
        restaurantId,
        createdAt: { gte: today },
        customerId: { not: null },
      },
    });

    return {
      customers,
      stats: {
        todayCustomers,
        todayVisitors,
      },
    };
  }

  async findOne(restaurantId: string, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.restaurantId !== restaurantId) {
      throw new NotFoundException('Customer not found');
    }

    const purchaseHistory = await this.prisma.bill.findMany({
      where: {
        customerId: id,
        restaurantId,
        status: { in: ['PAID', 'CLOSED'] },
      },
      include: {
        items: true,
        payments: {
          where: { status: 'APPROVED' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const latestDeliveryBill = await this.prisma.bill.findFirst({
      where: {
        customerId: id,
        restaurantId,
        deliveryAddress: { not: null },
        NOT: {
          deliveryAddress: '',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let address = '';
    if (latestDeliveryBill && latestDeliveryBill.deliveryAddress && latestDeliveryBill.deliveryAddress.trim() !== '') {
      const parts = [
        latestDeliveryBill.deliveryAddress,
        latestDeliveryBill.deliverySuburb,
        latestDeliveryBill.deliveryState,
        latestDeliveryBill.deliveryPostcode,
      ].filter((part) => part && part.trim() !== '');
      address = parts.join(', ');
    }

    const loyaltyActivity = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { ...customer, address, purchaseHistory, loyaltyActivity };
  }

  async adjustLoyaltyPoints(restaurantId: string, id: string, data: { pointsChange: number; reason: string }, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer || customer.restaurantId !== restaurantId) {
      throw new NotFoundException('Customer not found');
    }

    const pointsChangeInt = parseInt(data.pointsChange.toString(), 10);
    const newBalance = customer.loyaltyPoints + pointsChangeInt;

    const transaction = await this.prisma.loyaltyTransaction.create({
      data: {
        customerId: id,
        type: pointsChangeInt > 0 ? 'MANUAL_ADD' : 'MANUAL_DEDUCT',
        pointsDelta: pointsChangeInt,
        balanceAfter: newBalance,
        reason: data.reason,
        performedById: userId,
      },
    });

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: newBalance },
    });

    return { customer: updatedCustomer, transaction };
  }
}

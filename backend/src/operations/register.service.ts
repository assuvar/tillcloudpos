import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class RegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async openRegister(
    userId: string,
    restaurantId: string,
    terminalId: string | null,
    openingCash: number, // In cents
  ) {
    // Check if user already has an active register session
    const activeSession = await this.prisma.registerSession.findFirst({
      where: {
        userId,
        restaurantId,
        sessionStatus: 'OPEN',
      },
    });

    if (activeSession) {
      return activeSession;
    }

    const session = await this.prisma.registerSession.create({
      data: {
        restaurantId,
        userId,
        terminalId,
        openingCash,
        sessionStatus: 'OPEN',
      },
      include: {
        terminal: true,
      },
    });

    await this.auditService.createLog(
      userId,
      restaurantId,
      'REGISTER_OPEN',
      `Opened register session with starting cash of ${(openingCash / 100).toFixed(2)} AUD`,
    );

    return session;
  }

  async getExpectedCash(
    userId: string,
    restaurantId: string,
    openedAt: Date,
    openingCash: number,
  ) {
    const cashPayments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: openedAt,
        },
        method: 'CASH',
        status: { in: ['APPROVED', 'PENDING'] },
        bill: {
          cashierId: userId,
          restaurantId,
        },
      },
    });

    const totalCashSales = cashPayments.reduce(
      (sum, p) => sum + p.amountCents,
      0,
    );
    return openingCash + totalCashSales;
  }

  async getActiveRegister(userId: string, restaurantId: string) {
    const active = await this.prisma.registerSession.findFirst({
      where: {
        userId,
        restaurantId,
        sessionStatus: 'OPEN',
      },
      include: {
        terminal: true,
      },
    });

    if (!active) {
      return null;
    }

    // Include calculated expected cash in real-time
    const expectedCash = await this.getExpectedCash(
      userId,
      restaurantId,
      active.openedAt,
      active.openingCash,
    );

    return {
      ...active,
      expectedCash,
    };
  }

  async closeRegister(
    userId: string,
    restaurantId: string,
    closingCash: number, // In cents
  ) {
    const active = await this.prisma.registerSession.findFirst({
      where: {
        userId,
        restaurantId,
        sessionStatus: 'OPEN',
      },
    });

    if (!active) {
      throw new BadRequestException(
        'No active register session found for this cashier.',
      );
    }

    const expectedCash = await this.getExpectedCash(
      userId,
      restaurantId,
      active.openedAt,
      active.openingCash,
    );

    const variance = closingCash - expectedCash;
    const now = new Date();

    const session = await this.prisma.registerSession.update({
      where: { id: active.id },
      data: {
        closingCash,
        expectedCash,
        variance,
        closedAt: now,
        closedByUserId: userId,
        sessionStatus: 'CLOSED',
      },
    });

    await this.auditService.createLog(
      userId,
      restaurantId,
      'REGISTER_CLOSE',
      `Closed register session. Counted: ${(closingCash / 100).toFixed(2)} AUD. Expected: ${(expectedCash / 100).toFixed(2)} AUD. Variance: ${(variance / 100).toFixed(2)} AUD`,
    );

    return session;
  }
}

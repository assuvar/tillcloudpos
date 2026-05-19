import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async clockIn(userId: string, restaurantId: string) {
    // Check if already clocked in
    const activeSession = await this.prisma.attendanceSession.findFirst({
      where: {
        userId,
        restaurantId,
        attendanceStatus: 'ACTIVE',
      },
    });

    if (activeSession) {
      return activeSession;
    }

    const now = new Date();
    // Use start of day for shiftDate
    const shiftDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const session = await this.prisma.attendanceSession.create({
      data: {
        restaurantId,
        userId,
        clockInTime: now,
        shiftDate,
        attendanceStatus: 'ACTIVE',
      },
    });

    await this.auditService.createLog(
      userId,
      restaurantId,
      'CLOCK_IN',
      `Clock-in successful at ${now.toLocaleTimeString()}`,
    );

    return session;
  }

  async clockOut(userId: string, restaurantId: string) {
    const activeSession = await this.prisma.attendanceSession.findFirst({
      where: {
        userId,
        restaurantId,
        attendanceStatus: 'ACTIVE',
      },
    });

    if (!activeSession) {
      throw new BadRequestException('You are not currently clocked in.');
    }

    // 2. Protection Check: Active order pending
    const pendingOrders = await this.prisma.bill.findMany({
      where: {
        cashierId: userId,
        restaurantId,
        status: {
          in: ['OPEN', 'KOT_SENT', 'PREPARING', 'READY', 'AWAITING_PAYMENT'],
        },
      },
    });
    if (pendingOrders.length > 0) {
      throw new BadRequestException(
        `Cannot clock out with ${pendingOrders.length} pending order(s). Please clear or transfer them first.`,
      );
    }

    const now = new Date();
    const diffMs = now.getTime() - activeSession.clockInTime.getTime();
    const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    const session = await this.prisma.attendanceSession.update({
      where: { id: activeSession.id },
      data: {
        clockOutTime: now,
        attendanceStatus: 'COMPLETED',
        totalHours,
      },
    });

    await this.auditService.createLog(
      userId,
      restaurantId,
      'CLOCK_OUT',
      `Clock-out successful at ${now.toLocaleTimeString()}. Total hours: ${totalHours}`,
    );

    return session;
  }

  async getCurrentSession(userId: string, restaurantId: string) {
    return this.prisma.attendanceSession.findFirst({
      where: {
        userId,
        restaurantId,
        attendanceStatus: 'ACTIVE',
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.attendanceSession.findMany({
      where: { restaurantId },
      orderBy: { clockInTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async findByEmployee(userId: string, restaurantId: string) {
    return this.prisma.attendanceSession.findMany({
      where: { userId, restaurantId },
      orderBy: { clockInTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }
}

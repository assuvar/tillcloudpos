import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(
    userId: string | null,
    restaurantId: string,
    action: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        restaurantId,
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    });
  }

  async fetchLogs(
    restaurantId: string,
    limit = 50,
    offset = 0,
    action?: string,
    userId?: string,
  ) {
    const where: any = { restaurantId };
    if (action) {
      where.action = action;
    }
    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

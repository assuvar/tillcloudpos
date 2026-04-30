import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
} from './dto/reservations.dto';
import { ReservationStatus, TableStatus } from '../../generated/prisma';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateReservationDto) {
    const { tableId, tableIds, ...data } = dto;
    const finalTableId =
      tableId || (tableIds && tableIds.length > 0 ? tableIds[0] : null);
    const allTableIds =
      tableIds && tableIds.length > 0 ? tableIds : tableId ? [tableId] : [];

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          customerName: data.customerName,
          mobile: data.mobile,
          guests: data.guests,
          dateTime: new Date(data.dateTime),
          floor: data.floor,
          notes: data.notes,
          restaurantId,
          tableId: finalTableId,
        },
      });

      if (allTableIds.length > 0) {
        await tx.table.updateMany({
          where: { id: { in: allTableIds }, restaurantId },
          data: { status: TableStatus.RESERVED },
        });
      }

      return reservation;
    });
  }

  async findAll(restaurantId: string, status?: ReservationStatus) {
    return this.prisma.reservation.findMany({
      where: {
        restaurantId,
        ...(status ? { status } : {}),
      },
      include: {
        table: true,
        customer: true,
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  async findToday(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.reservation.findMany({
      where: {
        restaurantId,
        dateTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { table: true },
      orderBy: { dateTime: 'asc' },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, restaurantId },
      include: {
        table: true,
        customer: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async update(restaurantId: string, id: string, dto: UpdateReservationDto) {
    const { tableId, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.reservation.findFirst({
        where: { id, restaurantId },
      });

      if (!current) throw new NotFoundException('Reservation not found');

      const updated = await tx.reservation.update({
        where: { id },
        data: {
          customerName: data.customerName,
          mobile: data.mobile,
          guests: data.guests,
          dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
          floor: data.floor,
          status: data.status,
          notes: data.notes,
          tableId,
        },
      });

      // Handle table status changes
      if (tableId && tableId !== current.tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: TableStatus.RESERVED },
        });
        if (current.tableId) {
          await tx.table.update({
            where: { id: current.tableId },
            data: { status: TableStatus.AVAILABLE },
          });
        }
      }

      if (
        data.status === ReservationStatus.CANCELLED ||
        data.status === ReservationStatus.NOSHOW
      ) {
        if (updated.tableId) {
          await tx.table.update({
            where: { id: updated.tableId },
            data: { status: TableStatus.AVAILABLE },
          });
        }
      }

      return updated;
    });
  }

  async remove(restaurantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, restaurantId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.tableId) {
      await this.prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: TableStatus.AVAILABLE },
      });
    }

    return this.prisma.reservation.delete({
      where: { id, restaurantId },
    });
  }
}

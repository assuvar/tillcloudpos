import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateTableGroupDto,
  UpdateTableGroupDto,
  MergeTablesDto,
} from './dto/tables.dto';
import { TableStatus, Floor } from '../../generated/prisma';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  // Table Groups
  async createGroup(restaurantId: string, dto: CreateTableGroupDto) {
    return this.prisma.tableGroup.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async findAllGroups(restaurantId: string) {
    const groups = await this.prisma.tableGroup.findMany({
      where: { restaurantId },
      include: {
        tables: {
          where: { status: { not: TableStatus.MERGED } },
          include: {
            bills: {
              where: {
                status: { in: ['OPEN', 'KOT_SENT', 'AWAITING_PAYMENT'] as any },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            reservations: {
              where: { status: { in: ['PENDING', 'CONFIRMED'] as any } },
              take: 1,
              orderBy: { dateTime: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Post-process to simplify bill data for the frontend
    return groups.map((group) => ({
      ...group,
      tables: group.tables.map((table) => {
        const activeBill = table.bills[0];
        const activeRes = table.reservations[0];
        return {
          ...table,
          activeBillId: activeBill?.id || null,
          currentOrderId: activeBill?.id || null,
          startedAt: table.startedAt || activeBill?.createdAt || null,
          currentTotal: activeBill
            ? Number(activeBill.totalCents || 0) / 100
            : 0,
          isKotSent: activeBill
            ? activeBill.status === 'KOT_SENT' ||
              activeBill.status === 'AWAITING_PAYMENT'
            : false,
          customerName: activeRes?.customerName || null,
          bills: undefined,
          reservations: undefined,
        };
      }),
    }));
  }

  async updateGroup(
    restaurantId: string,
    id: string,
    dto: UpdateTableGroupDto,
  ) {
    return this.prisma.tableGroup.update({
      where: { id, restaurantId },
      data: dto,
    });
  }

  async deleteGroup(restaurantId: string, id: string) {
    return this.prisma.tableGroup.delete({
      where: { id, restaurantId },
    });
  }

  // Tables
  async createTable(restaurantId: string, dto: CreateTableDto) {
    let groupId = dto.groupId;

    if (!groupId) {
      // Find or create a default group for this restaurant
      let defaultGroup = await this.prisma.tableGroup.findFirst({
        where: { restaurantId, name: 'Default' },
      });

      if (!defaultGroup) {
        defaultGroup = await this.prisma.tableGroup.create({
          data: { restaurantId, name: 'Default', sortOrder: 0 },
        });
      }

      groupId = defaultGroup.id;
    } else {
      // Verify the provided group exists and belongs to restaurant
      const group = await this.prisma.tableGroup.findFirst({
        where: { id: groupId, restaurantId },
      });

      if (!group) {
        throw new NotFoundException('Table group not found');
      }
    }

    const { groupId: _ignored, ...rest } = dto;

    // Safety check for ghost merged tables
    const existingTable = await this.prisma.table.findFirst({
      where: {
        restaurantId,
        name: rest.name,
        floor: rest.floor || Floor.GROUND,
      },
    });

    if (existingTable) {
      if (existingTable.status === TableStatus.MERGED) {
        // Check if it's a ghost (not part of any active virtual table)
        const virtualTable = await this.prisma.table.findFirst({
          where: {
            restaurantId,
            isMerged: true,
            originalTableIds: { has: existingTable.id },
          },
        });

        if (!virtualTable) {
          // It's a ghost! Clean it up.
          await this.prisma.table.delete({ where: { id: existingTable.id } });
        } else {
          throw new BadRequestException(
            `Table "${rest.name}" is currently part of a merged table (${virtualTable.name})`,
          );
        }
      } else {
        throw new BadRequestException(
          'A table with that name already exists on this floor',
        );
      }
    }

    try {
      return await this.prisma.table.create({
        data: {
          ...rest,
          groupId,
          restaurantId,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A table with that name already exists on this floor',
        );
      }
      throw e;
    }
  }

  async findAllTables(
    restaurantId: string,
    floor?: Floor,
    status?: TableStatus,
  ) {
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId,
        status: { not: TableStatus.MERGED },
        ...(floor ? { floor } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        bills: {
          where: {
            status: { in: ['OPEN', 'KOT_SENT', 'AWAITING_PAYMENT'] as any },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        reservations: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] as any } },
          take: 1,
          orderBy: { dateTime: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return tables.map((table) => {
      const activeBill = table.bills[0];
      const activeRes = table.reservations[0];
      return {
        ...table,
        activeBillId: activeBill?.id || null,
        currentOrderId: activeBill?.id || null,
        startedAt: table.startedAt || activeBill?.createdAt || null,
        currentTotal: activeBill ? Number(activeBill.totalCents || 0) / 100 : 0,
        isKotSent: activeBill
          ? activeBill.status === 'KOT_SENT' ||
            activeBill.status === 'AWAITING_PAYMENT'
          : false,
        customerName: activeRes?.customerName || null,
        bills: undefined,
        reservations: undefined,
      };
    });
  }

  async findOneTable(restaurantId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
      include: { group: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  async updateTable(restaurantId: string, id: string, dto: UpdateTableDto) {
    return this.prisma.table.update({
      where: { id, restaurantId },
      data: dto,
    });
  }

  async deleteTable(restaurantId: string, id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id, restaurantId },
    });

    if (!table) throw new NotFoundException('Table not found');

    return this.prisma.$transaction(async (tx) => {
      // If this is a virtual/merged table, try to restore the original tables
      if (table.isMerged && table.originalTableIds.length > 0) {
        await tx.table.updateMany({
          where: {
            id: { in: table.originalTableIds },
            restaurantId,
            status: TableStatus.MERGED,
          },
          data: { status: TableStatus.AVAILABLE },
        });
      }

      return tx.table.delete({
        where: { id },
      });
    });
  }

  async updateTableStatus(
    restaurantId: string,
    id: string,
    status: TableStatus,
    currentOrderId?: string,
  ) {
    return this.prisma.table.update({
      where: { id, restaurantId },
      data: {
        status,
        currentOrderId: currentOrderId || null,
        activeBillId: currentOrderId || null,
        startedAt: status === TableStatus.OCCUPIED ? new Date() : undefined,
      },
    });
  }

  async shiftTable(restaurantId: string, sourceId: string, targetId: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.table.findFirst({
        where: { id: sourceId, restaurantId },
      });
      const target = await tx.table.findFirst({
        where: { id: targetId, restaurantId },
      });

      if (!source || !target) throw new NotFoundException('Table not found');
      if (target.status !== TableStatus.AVAILABLE) {
        throw new BadRequestException('Target table is not available');
      }

      // Move active bill from source to target
      await tx.table.update({
        where: { id: targetId },
        data: {
          status: source.status,
          activeBillId: source.activeBillId,
          currentOrderId: source.currentOrderId,
          startedAt: source.startedAt,
        },
      });

      // Update bills to point to new table
      if (source.activeBillId) {
        await tx.bill.update({
          where: { id: source.activeBillId },
          data: { tableId: targetId },
        });
      }

      // Clear source table
      await tx.table.update({
        where: { id: sourceId },
        data: {
          status: TableStatus.AVAILABLE,
          activeBillId: null,
          currentOrderId: null,
          startedAt: null,
        },
      });

      return target;
    });
  }

  async mergeTables(restaurantId: string, dto: MergeTablesDto) {
    const { tableIds } = dto;

    return this.prisma.$transaction(async (tx) => {
      const tables = await tx.table.findMany({
        where: {
          id: { in: tableIds },
          restaurantId,
          status: TableStatus.AVAILABLE,
        },
      });

      if (tables.length !== tableIds.length) {
        throw new BadRequestException(
          'Some tables are not available for merging',
        );
      }

      const floor = tables[0].floor;
      if (tables.some((t) => t.floor !== floor)) {
        throw new BadRequestException('Tables must be on the same floor');
      }

      const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
      const mergedName = tables.map((t) => t.name).join('+');

      // Create a virtual table
      const virtualTable = await tx.table.create({
        data: {
          restaurantId,
          groupId: tables[0].groupId,
          name: mergedName,
          seats: totalSeats,
          floor,
          status: TableStatus.AVAILABLE,
          isMerged: true,
          originalTableIds: tableIds,
        },
      });

      // Mark original tables as MERGED
      await tx.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: TableStatus.MERGED },
      });

      return virtualTable;
    });
  }

  async clearTable(restaurantId: string, id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id, restaurantId },
    });

    if (!table) throw new NotFoundException('Table not found');

    return this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.AVAILABLE,
        activeBillId: null,
        currentOrderId: null,
        startedAt: null,
        isMerged: false,
      },
    });
  }

  async unmergeTable(restaurantId: string, id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id, restaurantId },
    });

    if (!table) throw new NotFoundException('Table not found');
    if (!table.isMerged)
      throw new BadRequestException('Table is not a merged table');
    if (table.activeBillId)
      throw new BadRequestException(
        'Cannot unmerge table with an active bill. Please clear the table first.',
      );

    return this.prisma.$transaction(async (tx) => {
      // Restore original tables
      if (table.originalTableIds.length > 0) {
        await tx.table.updateMany({
          where: {
            id: { in: table.originalTableIds },
            restaurantId,
            status: TableStatus.MERGED,
          },
          data: {
            status: TableStatus.AVAILABLE,
            isMerged: false,
          },
        });
      }

      // Delete virtual table
      return tx.table.delete({
        where: { id },
      });
    });
  }
}

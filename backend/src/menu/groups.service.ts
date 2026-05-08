import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuGroupDto } from './dto/combos.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateMenuGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.menuGroup.create({
        data: {
          restaurantId,
          name: dto.name,
          minSelect: dto.minSelect ?? 1,
          maxSelect: dto.maxSelect ?? 1,
          required: dto.required ?? true,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.menuGroupItem.createMany({
          data: dto.items.map((it) => ({
            menuGroupId: group.id,
            menuItemId: it.menuItemId,
            priceOverrideInCents: it.priceOverrideInCents,
          })),
        });
      }

      return tx.menuGroup.findUnique({
        where: { id: group.id },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.menuGroup.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const group = await this.prisma.menuGroup.findFirst({
      where: { id, restaurantId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Selectable Menu Group not found');
    }

    return group;
  }

  async update(restaurantId: string, id: string, dto: CreateMenuGroupDto) {
    const existing = await this.findOne(restaurantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.menuGroup.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          minSelect: dto.minSelect ?? 1,
          maxSelect: dto.maxSelect ?? 1,
          required: dto.required ?? true,
        },
      });

      // Simple sync: delete items and recreate them
      await tx.menuGroupItem.deleteMany({
        where: { menuGroupId: existing.id },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.menuGroupItem.createMany({
          data: dto.items.map((it) => ({
            menuGroupId: existing.id,
            menuItemId: it.menuItemId,
            priceOverrideInCents: it.priceOverrideInCents,
          })),
        });
      }

      return tx.menuGroup.findUnique({
        where: { id: existing.id },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    });
  }

  async remove(restaurantId: string, id: string) {
    const existing = await this.findOne(restaurantId, id);

    await this.prisma.menuGroup.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }
}

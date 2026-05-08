import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVariationGroupDto } from './dto/modifiers.dto';

@Injectable()
export class VariationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateVariationGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.variationGroup.create({
        data: {
          restaurantId,
          name: dto.name,
          type: dto.type || 'SINGLE',
        },
      });

      if (dto.options && dto.options.length > 0) {
        await tx.variationOption.createMany({
          data: dto.options.map((opt) => ({
            variationGroupId: group.id,
            name: opt.name,
            priceInCents: opt.priceInCents,
            sortOrder: opt.sortOrder || 0,
          })),
        });
      }

      return tx.variationGroup.findUnique({
        where: { id: group.id },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.variationGroup.findMany({
      where: { restaurantId },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        menuItems: { select: { menuItemId: true } },
        categories: { select: { categoryId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const group = await this.prisma.variationGroup.findFirst({
      where: { id, restaurantId },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        menuItems: { select: { menuItemId: true } },
        categories: { select: { categoryId: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Variation Group not found');
    }

    return group;
  }

  async update(restaurantId: string, id: string, dto: CreateVariationGroupDto) {
    const existing = await this.findOne(restaurantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.variationGroup.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          type: dto.type || 'SINGLE',
        },
      });

      // Simple sync: delete all options and recreate them
      await tx.variationOption.deleteMany({
        where: { variationGroupId: existing.id },
      });

      if (dto.options && dto.options.length > 0) {
        await tx.variationOption.createMany({
          data: dto.options.map((opt) => ({
            variationGroupId: existing.id,
            name: opt.name,
            priceInCents: opt.priceInCents,
            sortOrder: opt.sortOrder || 0,
          })),
        });
      }

      return tx.variationGroup.findUnique({
        where: { id: existing.id },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async remove(restaurantId: string, id: string) {
    const existing = await this.findOne(restaurantId, id);

    await this.prisma.variationGroup.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }

  async assignToItem(restaurantId: string, groupId: string, itemId: string) {
    await this.findOne(restaurantId, groupId);

    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
    });
    if (!item) throw new NotFoundException('Menu item not found');

    await this.prisma.menuItemVariationGroup.upsert({
      where: {
        menuItemId_variationGroupId: { menuItemId: itemId, variationGroupId: groupId },
      },
      create: { menuItemId: itemId, variationGroupId: groupId },
      update: {},
    });

    return { success: true };
  }

  async unassignFromItem(restaurantId: string, groupId: string, itemId: string) {
    await this.findOne(restaurantId, groupId);

    await this.prisma.menuItemVariationGroup.deleteMany({
      where: { menuItemId: itemId, variationGroupId: groupId },
    });

    return { success: true };
  }

  async assignToCategory(restaurantId: string, groupId: string, categoryId: string) {
    await this.findOne(restaurantId, groupId);

    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.menuCategoryVariationGroup.upsert({
      where: {
        categoryId_variationGroupId: { categoryId, variationGroupId: groupId },
      },
      create: { categoryId, variationGroupId: groupId },
      update: {},
    });

    return { success: true };
  }

  async unassignFromCategory(restaurantId: string, groupId: string, categoryId: string) {
    await this.findOne(restaurantId, groupId);

    await this.prisma.menuCategoryVariationGroup.deleteMany({
      where: { categoryId, variationGroupId: groupId },
    });

    return { success: true };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddonGroupDto } from './dto/modifiers.dto';

@Injectable()
export class AddonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateAddonGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.addonGroup.create({
        data: {
          restaurantId,
          name: dto.name,
          selectionType: dto.selectionType || 'MULTIPLE',
        },
      });

      if (dto.addons && dto.addons.length > 0) {
        await tx.addonOption.createMany({
          data: dto.addons.map((add) => ({
            addonGroupId: group.id,
            name: add.name,
            priceInCents: add.priceInCents,
            sortOrder: add.sortOrder || 0,
          })),
        });
      }

      return tx.addonGroup.findUnique({
        where: { id: group.id },
        include: { addons: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.addonGroup.findMany({
      where: { restaurantId },
      include: {
        addons: { orderBy: { sortOrder: 'asc' } },
        menuItems: { select: { menuItemId: true } },
        categories: { select: { categoryId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const group = await this.prisma.addonGroup.findFirst({
      where: { id, restaurantId },
      include: {
        addons: { orderBy: { sortOrder: 'asc' } },
        menuItems: { select: { menuItemId: true } },
        categories: { select: { categoryId: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Addon Group not found');
    }

    return group;
  }

  async update(restaurantId: string, id: string, dto: CreateAddonGroupDto) {
    const existing = await this.findOne(restaurantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.addonGroup.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          selectionType: dto.selectionType || 'MULTIPLE',
        },
      });

      // Sync: delete all existing options and recreate them
      await tx.addonOption.deleteMany({
        where: { addonGroupId: existing.id },
      });

      if (dto.addons && dto.addons.length > 0) {
        await tx.addonOption.createMany({
          data: dto.addons.map((add) => ({
            addonGroupId: existing.id,
            name: add.name,
            priceInCents: add.priceInCents,
            sortOrder: add.sortOrder || 0,
          })),
        });
      }

      return tx.addonGroup.findUnique({
        where: { id: existing.id },
        include: { addons: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async remove(restaurantId: string, id: string) {
    const existing = await this.findOne(restaurantId, id);

    await this.prisma.addonGroup.delete({
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

    await this.prisma.menuItemAddonGroup.upsert({
      where: {
        menuItemId_addonGroupId: { menuItemId: itemId, addonGroupId: groupId },
      },
      create: { menuItemId: itemId, addonGroupId: groupId },
      update: {},
    });

    return { success: true };
  }

  async unassignFromItem(restaurantId: string, groupId: string, itemId: string) {
    await this.findOne(restaurantId, groupId);

    await this.prisma.menuItemAddonGroup.deleteMany({
      where: { menuItemId: itemId, addonGroupId: groupId },
    });

    return { success: true };
  }

  async assignToCategory(restaurantId: string, groupId: string, categoryId: string) {
    await this.findOne(restaurantId, groupId);

    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.menuCategoryAddonGroup.upsert({
      where: {
        categoryId_addonGroupId: { categoryId, addonGroupId: groupId },
      },
      create: { categoryId, addonGroupId: groupId },
      update: {},
    });

    return { success: true };
  }

  async unassignFromCategory(restaurantId: string, groupId: string, categoryId: string) {
    await this.findOne(restaurantId, groupId);

    await this.prisma.menuCategoryAddonGroup.deleteMany({
      where: { categoryId, addonGroupId: groupId },
    });

    return { success: true };
  }
}

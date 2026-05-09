import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/combos.dto';
import { MenuService } from './menu.service';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateDealDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          restaurantId,
          name: dto.name,
          description: dto.description || null,
          priceInCents: dto.priceInCents,
          color: dto.color || null,
          shortcode: dto.shortcode || null,
          isActive: dto.isActive ?? true,
        },
      });

      if (dto.groups && dto.groups.length > 0) {
        await tx.dealGroup.createMany({
          data: dto.groups.map((g) => ({
            dealId: deal.id,
            menuGroupId: g.menuGroupId,
            sortOrder: g.sortOrder || 0,
          })),
        });
      }

      if (dto.addonGroups && dto.addonGroups.length > 0) {
        await tx.dealAddonGroup.createMany({
          data: dto.addonGroups.map((a) => ({
            dealId: deal.id,
            addonGroupId: a.addonGroupId,
          })),
        });
      }

      return tx.deal.findUnique({
        where: { id: deal.id },
        include: {
          groups: {
            include: {
              menuGroup: {
                include: {
                  items: {
                    include: {
                      menuItem: true,
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          addonGroups: {
            include: {
              addonGroup: {
                include: {
                  addons: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      });
    });

    MenuService.invalidateCache(restaurantId);
    return result;
  }

  async findAll(restaurantId: string) {
    return this.prisma.deal.findMany({
      where: { restaurantId },
      include: {
        groups: {
          include: {
            menuGroup: {
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        addonGroups: {
          include: {
            addonGroup: {
              include: {
                addons: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, restaurantId },
      include: {
        groups: {
          include: {
            menuGroup: {
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        addonGroups: {
          include: {
            addonGroup: {
              include: {
                addons: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Combo Deal not found');
    }

    return deal;
  }

  async update(restaurantId: string, id: string, dto: CreateDealDto) {
    const existing = await this.findOne(restaurantId, id);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.deal.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description || null,
          priceInCents: dto.priceInCents,
          color: dto.color || null,
          shortcode: dto.shortcode || null,
          isActive: dto.isActive ?? true,
        },
      });

      // Clear child groups & addons join records
      await tx.dealGroup.deleteMany({ where: { dealId: existing.id } });
      await tx.dealAddonGroup.deleteMany({ where: { dealId: existing.id } });

      if (dto.groups && dto.groups.length > 0) {
        await tx.dealGroup.createMany({
          data: dto.groups.map((g) => ({
            dealId: existing.id,
            menuGroupId: g.menuGroupId,
            sortOrder: g.sortOrder || 0,
          })),
        });
      }

      if (dto.addonGroups && dto.addonGroups.length > 0) {
        await tx.dealAddonGroup.createMany({
          data: dto.addonGroups.map((a) => ({
            dealId: existing.id,
            addonGroupId: a.addonGroupId,
          })),
        });
      }

      return tx.deal.findUnique({
        where: { id: existing.id },
        include: {
          groups: {
            include: {
              menuGroup: {
                include: {
                  items: {
                    include: {
                      menuItem: true,
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          addonGroups: {
            include: {
              addonGroup: {
                include: {
                  addons: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      });
    });

    MenuService.invalidateCache(restaurantId);
    return result;
  }

  async remove(restaurantId: string, id: string) {
    const existing = await this.findOne(restaurantId, id);

    await this.prisma.deal.delete({
      where: { id: existing.id },
    });

    MenuService.invalidateCache(restaurantId);
    return { success: true };
  }
}

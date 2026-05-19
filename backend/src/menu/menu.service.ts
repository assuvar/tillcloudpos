import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes default TTL

  public static invalidateCache(restaurantId: string) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${restaurantId}:`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    console.log(
      `[MenuCache] Invalidated cache for restaurant: ${restaurantId}`,
    );
  }

  /**
   * Normalize a service type string into camelCase to match the JSON visibility properties.
   * e.g., "DINE_IN" -> "dineIn", "delivery" -> "delivery", "online-ordering" -> "onlineOrdering"
   */
  private normalizeServiceType(serviceType: string): string {
    let key = serviceType.toLowerCase();
    if (key.includes('_')) {
      const parts = key.split('_');
      key =
        parts[0] +
        parts
          .slice(1)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
    } else if (key.includes('-')) {
      const parts = key.split('-');
      key =
        parts[0] +
        parts
          .slice(1)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
    }
    return key;
  }

  /**
   * Filter database items based on service type visibility JSON config.
   */
  filterItemsByServiceType(items: any[], serviceType?: string): any[] {
    if (!serviceType) {
      return items;
    }

    const normalizedKey = this.normalizeServiceType(serviceType);

    return items.filter((item) => {
      let vis = item.visibility;
      if (typeof vis === 'string') {
        try {
          vis = JSON.parse(vis);
        } catch (e) {
          vis = null;
        }
      }

      if (!vis) {
        return true; // Default to visible if no visibility configuration is found
      }

      // If the service type is specified, check if it's explicitly disabled (false)
      return vis[normalizedKey] !== false;
    });
  }

  async findCategoriesWithItems(restaurantId: string, serviceType?: string) {
    const cacheKey = `${restaurantId}:categories:${serviceType || 'all'}`;
    const cached = MenuService.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < MenuService.CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Fetch Categories and their directly linked modifier groups
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        sortOrder: true,
        color: true,
        variationGroups: {
          select: {
            variationGroup: {
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        addonGroups: {
          select: {
            addonGroup: {
              include: {
                addons: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        menuItems: {
          where: {
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            priceInCents: true,
            imageUrl: true,
            categoryId: true,
            isActive: true,
            sortOrder: true,
            color: true,
            shortcode: true,
            visibility: true,
            variationGroups: {
              select: {
                variationGroup: {
                  include: {
                    options: { orderBy: { sortOrder: 'asc' } },
                  },
                },
              },
            },
            addonGroups: {
              select: {
                addonGroup: {
                  include: {
                    addons: { orderBy: { sortOrder: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const mappedCategories = categories.map((category: any) => {
      const filteredItems = serviceType
        ? this.filterItemsByServiceType(category.menuItems, serviceType)
        : category.menuItems;

      // Extract category level modifiers
      const categoryVars = category.variationGroups.map(
        (g: any) => g.variationGroup,
      );
      const categoryAddons = category.addonGroups.map((g: any) => g.addonGroup);

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        variationGroups: categoryVars.map((g: any) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          options: g.options.map((o: any) => ({
            id: o.id,
            name: o.name,
            price: o.priceInCents / 100,
            priceInCents: o.priceInCents,
          })),
        })),
        addonGroups: categoryAddons.map((g: any) => ({
          id: g.id,
          name: g.name,
          selectionType: g.selectionType,
          addons: g.addons.map((a: any) => ({
            id: a.id,
            name: a.name,
            price: a.priceInCents / 100,
            priceInCents: a.priceInCents,
          })),
        })),
        items: filteredItems.map((item: any) => {
          // Resolve Inheritance: if item has no direct modifiers, inherit category-level modifiers
          const itemDirectVars = item.variationGroups.map(
            (g: any) => g.variationGroup,
          );
          const itemDirectAddons = item.addonGroups.map(
            (g: any) => g.addonGroup,
          );

          const varsToUse =
            itemDirectVars.length > 0 ? itemDirectVars : categoryVars;
          const addonsToUse =
            itemDirectAddons.length > 0 ? itemDirectAddons : categoryAddons;

          return {
            id: item.id,
            name: item.name,
            description: item.description ?? '',
            price: item.priceInCents / 100,
            categoryId: item.categoryId,
            image: item.imageUrl,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
            color: item.color,
            shortcode: item.shortcode,
            visibility: item.visibility,
            variationGroups: varsToUse.map((g: any) => ({
              id: g.id,
              name: g.name,
              type: g.type,
              options: g.options.map((o: any) => ({
                id: o.id,
                name: o.name,
                price: o.priceInCents / 100,
                priceInCents: o.priceInCents,
              })),
            })),
            addonGroups: addonsToUse.map((g: any) => ({
              id: g.id,
              name: g.name,
              selectionType: g.selectionType,
              addons: g.addons.map((a: any) => ({
                id: a.id,
                name: a.name,
                price: a.priceInCents / 100,
                priceInCents: a.priceInCents,
              })),
            })),
          };
        }),
      };
    });

    // 2. Fetch Active Combo Deals (filtered securely by restaurantId)
    const activeDeals = await this.prisma.deal.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
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

    // Filter deals by active service type if applicable
    const filteredDeals = serviceType
      ? this.filterItemsByServiceType(activeDeals, serviceType)
      : activeDeals;

    if (filteredDeals.length > 0) {
      mappedCategories.push({
        id: 'deals-category',
        name: 'Deals & Combos',
        color: '#f59e0b', // Vibrant themed amber/orange
        variationGroups: [],
        addonGroups: [],
        items: filteredDeals.map((deal: any) => ({
          id: deal.id,
          name: deal.name,
          description: deal.description ?? '',
          price: deal.priceInCents / 100,
          categoryId: 'deals-category',
          image: deal.imageUrl || null,
          isActive: deal.isActive,
          sortOrder: 0,
          color: deal.color || '#f59e0b',
          shortcode: deal.shortcode || null,
          visibility: deal.visibility,
          isDeal: true, // Tag explicitly to launch Deal builder modal in frontend
          groups: deal.groups.map((dg: any) => ({
            id: dg.menuGroup.id,
            name: dg.menuGroup.name,
            minSelect: dg.menuGroup.minSelect,
            maxSelect: dg.menuGroup.maxSelect,
            required: dg.menuGroup.required,
            items: dg.menuGroup.items.map((gi: any) => ({
              id: gi.menuItem.id,
              name: gi.menuItem.name,
              priceInCents: gi.menuItem.priceInCents,
              priceOverride:
                gi.priceOverrideInCents !== null
                  ? gi.priceOverrideInCents / 100
                  : null,
              priceOverrideInCents: gi.priceOverrideInCents,
            })),
          })),
          addonGroups: deal.addonGroups.map((da: any) => ({
            id: da.addonGroup.id,
            name: da.addonGroup.name,
            selectionType: da.addonGroup.selectionType,
            addons: da.addonGroup.addons.map((add: any) => ({
              id: add.id,
              name: add.name,
              price: add.priceInCents / 100,
              priceInCents: add.priceInCents,
            })),
          })),
        })),
      });
    }

    MenuService.cache.set(cacheKey, {
      data: mappedCategories,
      timestamp: Date.now(),
    });
    return mappedCategories;
  }

  async findItems(
    restaurantId: string,
    categoryId?: string,
    serviceType?: string,
  ) {
    const cacheKey = `${restaurantId}:items:${categoryId || 'all'}:${serviceType || 'all'}`;
    const cached = MenuService.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < MenuService.CACHE_TTL_MS) {
      return cached.data;
    }

    const items = await this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        category: {
          isActive: true,
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        priceInCents: true,
        imageUrl: true,
        categoryId: true,
        color: true,
        shortcode: true,
        visibility: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    const filteredItems = serviceType
      ? this.filterItemsByServiceType(items, serviceType)
      : items;

    const mapped = filteredItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: item.priceInCents / 100,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      categoryColor: item.category.color,
      image: item.imageUrl,
      isActive: true,
      color: item.color,
      shortcode: item.shortcode,
      visibility: item.visibility,
    }));

    MenuService.cache.set(cacheKey, { data: mapped, timestamp: Date.now() });
    return mapped;
  }
}

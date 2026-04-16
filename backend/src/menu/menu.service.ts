import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findCategoriesWithItems(restaurantId: string) {
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
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        price: item.priceInCents / 100,
        categoryId: item.categoryId,
        image: item.imageUrl,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      })),
    }));
  }

  async findItems(restaurantId: string, categoryId?: string) {
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
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: item.priceInCents / 100,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      image: item.imageUrl,
      isActive: true,
    }));
  }
}

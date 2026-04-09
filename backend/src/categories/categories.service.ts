import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new category
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, restaurantId, sortOrder, isActive } = createCategoryDto;

    if (!name) {
      throw new BadRequestException('Category name is required');
    }

    // Check if category with same name already exists for this restaurant
    const existingCategory = await this.prisma.menuCategory.findUnique({
      where: { restaurantId_name: { restaurantId, name: name.trim() } },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    return await this.prisma.menuCategory.create({
      data: {
        name: name.trim(),
        restaurantId,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });
  }

  /**
   * Get all categories for a restaurant
   */
  async findAll(restaurantId: string) {
    return await this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      include: {
        menuItems: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    return category;
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    restaurantId: string,
  ) {
    // Verify category exists and belongs to this restaurant
    const existingCategory = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (existingCategory.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    // If updating name, check for duplicates
    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existingCategory.name
    ) {
      const duplicate = await this.prisma.menuCategory.findUnique({
        where: {
          restaurantId_name: {
            restaurantId,
            name: updateCategoryDto.name.trim(),
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    return await this.prisma.menuCategory.update({
      where: { id },
      data: {
        ...(updateCategoryDto.name && { name: updateCategoryDto.name.trim() }),
        ...(updateCategoryDto.sortOrder !== undefined && {
          sortOrder: updateCategoryDto.sortOrder,
        }),
        ...(updateCategoryDto.isActive !== undefined && {
          isActive: updateCategoryDto.isActive,
        }),
      },
    });
  }

  /**
   * Delete a category (soft delete by marking inactive)
   */
  async remove(id: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    // Check if category has items
    const itemCount = await this.prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing items',
      );
    }

    // Hard delete the category
    return await this.prisma.menuCategory.delete({
      where: { id },
    });
  }

  /**
   * Reorder categories
   */
  async reorder(restaurantId: string, categoryIds: string[]) {
    // Verify all categories belong to this restaurant
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        id: { in: categoryIds },
        restaurantId,
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException(
        'Some categories not found or access denied',
      );
    }

    // Update sort order
    const updatePromises = categoryIds.map((id, index) =>
      this.prisma.menuCategory.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );

    return await Promise.all(updatePromises);
  }
}

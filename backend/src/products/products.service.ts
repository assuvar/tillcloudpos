import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product (menu item)
   */
  async create(createProductDto: CreateProductDto) {
    const {
      name,
      categoryId,
      description,
      priceInCents,
      imageUrl,
      trackInventory,
      isActive,
      restaurantId,
    } = createProductDto;

    if (!name || !categoryId || priceInCents === undefined) {
      throw new BadRequestException(
        'Missing required fields: name, categoryId, priceInCents',
      );
    }

    if (priceInCents < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    // Verify category exists and belongs to this restaurant
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.restaurantId !== restaurantId) {
      throw new BadRequestException(
        'Category not found or does not belong to this restaurant',
      );
    }

    return await this.prisma.menuItem.create({
      data: {
        name: name.trim(),
        categoryId,
        description: description?.trim(),
        priceInCents,
        imageUrl: imageUrl?.trim() || null,
        trackInventory: trackInventory ?? false,
        isActive: isActive ?? true,
        restaurantId,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Get all products for a restaurant
   */
  async findAll(restaurantId: string) {
    return await this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: true,
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  /**
   * Get a single product by ID
   */
  async findOne(id: string, restaurantId: string) {
    const product = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryItem: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    return product;
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    restaurantId: string,
  ) {
    // Verify product exists and belongs to this restaurant
    const existingProduct = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (existingProduct.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    // If categoryId is being updated, verify new category exists
    if (
      updateProductDto.categoryId &&
      updateProductDto.categoryId !== existingProduct.categoryId
    ) {
      const category = await this.prisma.menuCategory.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category || category.restaurantId !== restaurantId) {
        throw new BadRequestException(
          'Category not found or does not belong to this restaurant',
        );
      }
    }

    // Validate price if provided
    if (
      updateProductDto.priceInCents !== undefined &&
      updateProductDto.priceInCents < 0
    ) {
      throw new BadRequestException('Price cannot be negative');
    }

    const updateData: any = {};

    if (updateProductDto.name !== undefined) {
      updateData.name = updateProductDto.name.trim();
    }
    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description?.trim() || null;
    }
    if (updateProductDto.categoryId !== undefined) {
      updateData.categoryId = updateProductDto.categoryId;
    }
    if (updateProductDto.priceInCents !== undefined) {
      updateData.priceInCents = updateProductDto.priceInCents;
    }
    if (updateProductDto.imageUrl !== undefined) {
      updateData.imageUrl = updateProductDto.imageUrl?.trim() || null;
    }
    if (updateProductDto.trackInventory !== undefined) {
      updateData.trackInventory = updateProductDto.trackInventory;
    }
    if (updateProductDto.isActive !== undefined) {
      updateData.isActive = updateProductDto.isActive;
    }

    return await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  /**
   * Delete a product
   */
  async remove(id: string, restaurantId: string) {
    // Verify product exists and belongs to this restaurant
    const product = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.restaurantId !== restaurantId) {
      throw new NotFoundException('Access denied');
    }

    // Delete associated inventory item if exists
    await this.prisma.inventoryItem.deleteMany({
      where: { menuItemId: id },
    });

    // Delete the menu item
    return await this.prisma.menuItem.delete({
      where: { id },
    });
  }

  /**
   * Get products by category
   */
  async findByCategory(categoryId: string, restaurantId: string) {
    return await this.prisma.menuItem.findMany({
      where: {
        categoryId,
        restaurantId,
      },
      include: {
        category: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Delete all products for a restaurant (for testing/reset)
   */
  async deleteAllForRestaurant(restaurantId: string) {
    // Delete all inventory items first
    await this.prisma.inventoryItem.deleteMany({
      where: { restaurantId },
    });

    // Delete all menu items
    const result = await this.prisma.menuItem.deleteMany({
      where: { restaurantId },
    });

    return result;
  }
}

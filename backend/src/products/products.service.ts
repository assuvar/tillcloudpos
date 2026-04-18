import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BillStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { toBaseQuantity } from '../inventory/inventory-units';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async saveUploadedImage(file?: any) {
    if (!file) {
      return null;
    }

    const uploadDir = join(process.cwd(), 'uploads', 'menu-images');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${randomUUID()}${extname(file.originalname || '') || '.jpg'}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, file.buffer);

    return `/uploads/menu-images/${fileName}`;
  }

  private async validateRecipeItems(
    restaurantId: string,
    recipeItems:
      | {
          ingredientId: string;
          quantity: number;
          unit?: string;
          conversionRatio?: number;
        }[]
      | undefined,
    trackInventory: boolean,
  ) {
    if (!trackInventory) {
      return [];
    }

    if (!recipeItems || recipeItems.length === 0) {
      throw new BadRequestException(
        'Recipe items are required when inventory tracking is enabled',
      );
    }

    const invalidQuantity = recipeItems.some((item) => item.quantity <= 0);
    if (invalidQuantity) {
      throw new BadRequestException('Recipe quantity must be greater than 0');
    }

    const ingredientIds = Array.from(
      new Set(recipeItems.map((item) => item.ingredientId)),
    );
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: {
        restaurantId,
        id: { in: ingredientIds },
      },
      select: { id: true, unit: true },
    });

    if (existingIngredients.length !== ingredientIds.length) {
      throw new BadRequestException(
        'One or more selected ingredients are invalid for this restaurant',
      );
    }

    const ingredientById = new Map(
      existingIngredients.map((ingredient) => [ingredient.id, ingredient]),
    );

    return recipeItems.map((item) => {
      const ingredient = ingredientById.get(item.ingredientId);
      if (!ingredient) {
        throw new BadRequestException(
          'One or more selected ingredients are invalid for this restaurant',
        );
      }

      return {
        ingredientId: item.ingredientId,
        quantity: toBaseQuantity(
          item.quantity,
          item.unit || ingredient.unit,
          item.conversionRatio,
        ),
      };
    });
  }

  /**
   * Create a new product (menu item)
   */
  async create(createProductDto: CreateProductDto, imageFile?: any) {
    const {
      name,
      categoryId,
      description,
      priceInCents,
      imageUrl,
      trackInventory,
      recipeItems,
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

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException(
        'Cross-tenant category access is forbidden',
      );
    }

    const normalizedTrackInventory = trackInventory ?? false;
    const validatedRecipeItems = await this.validateRecipeItems(
      restaurantId,
      recipeItems,
      normalizedTrackInventory,
    );

    const uploadedImageUrl = await this.saveUploadedImage(imageFile);

    return await this.prisma.menuItem.create({
      data: {
        name: name.trim(),
        categoryId,
        description: description?.trim(),
        priceInCents,
        imageUrl: uploadedImageUrl || imageUrl?.trim() || null,
        trackInventory: normalizedTrackInventory,
        isActive: isActive ?? true,
        restaurantId,
        recipeItems: normalizedTrackInventory
          ? {
              create: validatedRecipeItems.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
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
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
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
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.restaurantId !== restaurantId) {
      throw new ForbiddenException('Cross-tenant menu item access is forbidden');
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
    imageFile?: any,
  ) {
    // Verify product exists and belongs to this restaurant
    const existingProduct = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (existingProduct.restaurantId !== restaurantId) {
      throw new ForbiddenException('Cross-tenant menu item access is forbidden');
    }

    // If categoryId is being updated, verify new category exists
    if (
      updateProductDto.categoryId &&
      updateProductDto.categoryId !== existingProduct.categoryId
    ) {
      const category = await this.prisma.menuCategory.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (category.restaurantId !== restaurantId) {
        throw new ForbiddenException(
          'Cross-tenant category access is forbidden',
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

    const nextTrackInventory =
      updateProductDto.trackInventory ?? existingProduct.trackInventory;
    const hasRecipeUpdate = updateProductDto.recipeItems !== undefined;

    const validatedRecipeItems = await this.validateRecipeItems(
      restaurantId,
      hasRecipeUpdate
        ? updateProductDto.recipeItems
        : await this.prisma.recipeItem
            .findMany({
              where: { menuItemId: id },
              select: { ingredientId: true, quantity: true },
            })
            .then((items) =>
              items.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: Number(item.quantity),
              })),
            ),
      nextTrackInventory,
    );

    const uploadedImageUrl = await this.saveUploadedImage(imageFile);
    if (uploadedImageUrl) {
      updateData.imageUrl = uploadedImageUrl;
    }

    return await this.prisma.$transaction(async (tx) => {
      if (hasRecipeUpdate || !nextTrackInventory) {
        await tx.recipeItem.deleteMany({ where: { menuItemId: id } });
      }

      if (nextTrackInventory && hasRecipeUpdate) {
        await tx.recipeItem.createMany({
          data: validatedRecipeItems.map((item) => ({
            menuItemId: id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          })),
        });
      }

      return tx.menuItem.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          recipeItems: {
            include: {
              ingredient: true,
            },
          },
        },
      });
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
      throw new ForbiddenException('Cross-tenant menu item access is forbidden');
    }

    const activeBillItemCount = await this.prisma.billItem.count({
      where: {
        menuItemId: id,
        bill: {
          restaurantId,
          status: {
            in: [BillStatus.OPEN, BillStatus.KOT_SENT],
          },
        },
      },
    });

    if (activeBillItemCount > 0) {
      throw new BadRequestException(
        'Cannot delete item while it is used in active bills. Mark it inactive instead.',
      );
    }

    const archived = await this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
      include: {
        category: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    return {
      success: true,
      archived: true,
      item: archived,
    };
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

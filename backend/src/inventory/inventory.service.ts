import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { AdjustIngredientStockDto } from './dto/adjust-ingredient-stock.dto';
import {
  ConsumptionReportQueryDto,
  InventoryMovementQueryDto,
} from './dto/inventory-query.dto';
import { IngredientMovementType } from '../../generated/prisma';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  private mapIngredient(ingredient: any) {
    const quantity = this.toNumber(ingredient.quantity);
    const lowStockThreshold = this.toNumber(ingredient.lowStockThreshold);
    return {
      ...ingredient,
      quantity,
      lowStockThreshold,
      isLowStock: quantity <= lowStockThreshold,
      recipeCount: ingredient._count?.recipeItems ?? 0,
    };
  }

  async listIngredients(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    return ingredients.map((ingredient) => this.mapIngredient(ingredient));
  }

  async createIngredient(restaurantId: string, dto: CreateIngredientDto) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Ingredient name is required');
    }

    const unit = dto.unit?.trim() || 'units';
    const quantity = Number(dto.quantity ?? 0);
    const lowStockThreshold = Number(dto.lowStockThreshold ?? 0);

    if (quantity < 0 || lowStockThreshold < 0) {
      throw new BadRequestException('Quantity values cannot be negative');
    }

    const ingredient = await this.prisma.ingredient.create({
      data: {
        restaurantId,
        name,
        unit,
        quantity,
        lowStockThreshold,
      },
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });

    return this.mapIngredient(ingredient);
  }

  async updateIngredient(
    restaurantId: string,
    ingredientId: string,
    dto: UpdateIngredientDto,
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, restaurantId },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    if (dto.lowStockThreshold !== undefined && dto.lowStockThreshold < 0) {
      throw new BadRequestException('Low stock threshold cannot be negative');
    }

    const updated = await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        name: dto.name?.trim(),
        unit: dto.unit?.trim(),
        quantity: dto.quantity,
        lowStockThreshold: dto.lowStockThreshold,
      },
      include: {
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });

    return this.mapIngredient(updated);
  }

  async adjustIngredientStock(
    restaurantId: string,
    ingredientId: string,
    performedById: string,
    dto: AdjustIngredientStockDto,
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, restaurantId },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const quantity = Number(dto.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new BadRequestException('Adjustment quantity must be 0 or greater');
    }

    let type: IngredientMovementType;
    let nextQuantity = this.toNumber(ingredient.quantity);

    if (dto.mode === 'ADD') {
      type = IngredientMovementType.MANUAL_ADD;
      nextQuantity = nextQuantity + quantity;
    } else if (dto.mode === 'REMOVE') {
      type = IngredientMovementType.MANUAL_REMOVE;
      if (quantity > nextQuantity) {
        throw new BadRequestException(
          'Cannot remove more stock than available',
        );
      }
      nextQuantity = nextQuantity - quantity;
    } else {
      type = IngredientMovementType.SET_FIXED;
      nextQuantity = quantity;
    }

    const quantityChange = nextQuantity - this.toNumber(ingredient.quantity);

    const [updatedIngredient] = await this.prisma.$transaction([
      this.prisma.ingredient.update({
        where: { id: ingredientId },
        data: { quantity: nextQuantity },
      }),
      this.prisma.ingredientMovement.create({
        data: {
          ingredientId,
          restaurantId,
          type,
          quantityChange,
          quantityAfter: nextQuantity,
          reason: dto.reason?.trim() || null,
          performedById,
        },
      }),
    ]);

    return {
      ingredientId: updatedIngredient.id,
      quantity: this.toNumber(updatedIngredient.quantity),
      movement: {
        type,
        quantityChange,
        quantityAfter: nextQuantity,
      },
    };
  }

  async listMovements(restaurantId: string, query: InventoryMovementQueryDto) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);

    return this.prisma.ingredientMovement.findMany({
      where: {
        restaurantId,
        ingredientId: query.ingredientId || undefined,
        ...(query.type ? { type: query.type as IngredientMovementType } : {}),
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async lowStockReport(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    return ingredients
      .map((ingredient) => ({
        ...ingredient,
        quantity: this.toNumber(ingredient.quantity),
        lowStockThreshold: this.toNumber(ingredient.lowStockThreshold),
      }))
      .filter(
        (ingredient) => ingredient.quantity <= ingredient.lowStockThreshold,
      );
  }

  async consumptionReport(
    restaurantId: string,
    query: ConsumptionReportQueryDto,
  ) {
    const days = Math.min(Math.max(Number(query.days ?? 7), 1), 90);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const movements = await this.prisma.ingredientMovement.findMany({
      where: {
        restaurantId,
        type: IngredientMovementType.ORDER_DEDUCTION,
        createdAt: {
          gte: fromDate,
        },
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    });

    const summaryMap = new Map<
      string,
      { ingredientId: string; name: string; unit: string; consumed: number }
    >();

    for (const movement of movements) {
      const existing = summaryMap.get(movement.ingredientId) || {
        ingredientId: movement.ingredientId,
        name: movement.ingredient.name,
        unit: movement.ingredient.unit,
        consumed: 0,
      };
      existing.consumed += Math.abs(this.toNumber(movement.quantityChange));
      summaryMap.set(movement.ingredientId, existing);
    }

    return {
      days,
      fromDate,
      toDate: new Date(),
      items: Array.from(summaryMap.values()).sort(
        (a, b) => b.consumed - a.consumed,
      ),
    };
  }
}

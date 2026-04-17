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
import { normalizeIngredientUnit, toBaseQuantity } from './inventory-units';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    return Number(value ?? 0);
  }

  private mapIngredient(ingredient: any) {
    const unit = normalizeIngredientUnit(ingredient.unit);
    const quantity = toBaseQuantity(
      this.toNumber(ingredient.quantity),
      ingredient.unit,
    );
    const lowStockThreshold = toBaseQuantity(
      this.toNumber(ingredient.lowStockThreshold),
      ingredient.unit,
    );
    return {
      ...ingredient,
      unit,
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

    const sourceUnit = dto.unit?.trim() || 'units';
    const unit = normalizeIngredientUnit(sourceUnit);
    const quantity = toBaseQuantity(
      Number(dto.quantity ?? 0),
      sourceUnit,
      dto.conversionRatio,
    );
    const lowStockThreshold = toBaseQuantity(
      Number(dto.lowStockThreshold ?? 0),
      sourceUnit,
      dto.conversionRatio,
    );

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
      return {
        success: true,
        ingredientId,
        deleted: false,
      };
    }

    if (dto.quantity !== undefined && dto.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    if (dto.lowStockThreshold !== undefined && dto.lowStockThreshold < 0) {
      throw new BadRequestException('Low stock threshold cannot be negative');
    }

    const sourceUnit = dto.unit?.trim() || ingredient.unit;
    const unit = normalizeIngredientUnit(sourceUnit);
    const quantity =
      dto.quantity !== undefined
        ? toBaseQuantity(dto.quantity, sourceUnit, dto.conversionRatio)
        : toBaseQuantity(this.toNumber(ingredient.quantity), ingredient.unit);
    const lowStockThreshold =
      dto.lowStockThreshold !== undefined
        ? toBaseQuantity(dto.lowStockThreshold, sourceUnit, dto.conversionRatio)
        : toBaseQuantity(
            this.toNumber(ingredient.lowStockThreshold),
            ingredient.unit,
          );

    const updated = await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        name: dto.name?.trim(),
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

    const baseUnit = normalizeIngredientUnit(ingredient.unit);
    const adjustmentQuantity = toBaseQuantity(quantity, baseUnit);

    let type: IngredientMovementType;
    let nextQuantity = toBaseQuantity(
      this.toNumber(ingredient.quantity),
      ingredient.unit,
    );

    if (dto.mode === 'ADD') {
      type = IngredientMovementType.MANUAL_ADD;
      nextQuantity = nextQuantity + adjustmentQuantity;
    } else if (dto.mode === 'REMOVE') {
      type = IngredientMovementType.MANUAL_REMOVE;
      if (adjustmentQuantity > nextQuantity) {
        throw new BadRequestException(
          'Cannot remove more stock than available',
        );
      }
      nextQuantity = nextQuantity - adjustmentQuantity;
    } else {
      type = IngredientMovementType.SET_FIXED;
      nextQuantity = adjustmentQuantity;
    }

    const previousQuantity = toBaseQuantity(
      this.toNumber(ingredient.quantity),
      ingredient.unit,
    );
    const quantityChange = nextQuantity - previousQuantity;

    const [updatedIngredient] = await this.prisma.$transaction([
      this.prisma.ingredient.update({
        where: { id: ingredientId },
        data: { quantity: nextQuantity, unit: baseUnit },
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

  async removeIngredient(restaurantId: string, ingredientId: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, restaurantId },
      include: {
        recipeItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
        },
        _count: {
          select: {
            recipeItems: true,
          },
        },
      },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    if (ingredient._count.recipeItems > 0) {
      const linkedItems = ingredient.recipeItems
        .map((recipe) => recipe.menuItem?.name)
        .filter(Boolean)
        .join(', ');

      throw new BadRequestException(
        linkedItems
          ? `Cannot delete ingredient. It is used by menu items: ${linkedItems}`
          : 'Cannot delete ingredient while it is used in menu recipes',
      );
    }

    await this.prisma.ingredient.deleteMany({
      where: { id: ingredientId, restaurantId },
    });

    return {
      success: true,
      ingredientId,
      deleted: true,
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
        unit: normalizeIngredientUnit(ingredient.unit),
        quantity: toBaseQuantity(
          this.toNumber(ingredient.quantity),
          ingredient.unit,
        ),
        lowStockThreshold: toBaseQuantity(
          this.toNumber(ingredient.lowStockThreshold),
          ingredient.unit,
        ),
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
        unit: normalizeIngredientUnit(movement.ingredient.unit),
        consumed: 0,
      };
      existing.consumed += Math.abs(
        toBaseQuantity(
          this.toNumber(movement.quantityChange),
          movement.ingredient.unit,
        ),
      );
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

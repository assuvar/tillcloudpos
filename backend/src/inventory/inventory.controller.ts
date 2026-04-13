import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { AdjustIngredientStockDto } from './dto/adjust-ingredient-stock.dto';
import {
  ConsumptionReportQueryDto,
  InventoryMovementQueryDto,
} from './dto/inventory-query.dto';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }

  return 'default-restaurant';
};

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  listIngredients(@Req() req: any) {
    return this.inventoryService.listIngredients(getRestaurantId(req));
  }

  @Post('ingredients')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  createIngredient(@Req() req: any, @Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(getRestaurantId(req), dto);
  }

  @Patch('ingredients/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  updateIngredient(
    @Req() req: any,
    @Param('id') ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(
      getRestaurantId(req),
      ingredientId,
      dto,
    );
  }

  @Post('ingredients/:id/adjust')
  @RequirePermissions(PERMISSIONS.INVENTORY_MANAGE)
  adjustIngredient(
    @Req() req: any,
    @Param('id') ingredientId: string,
    @Body() dto: AdjustIngredientStockDto,
  ) {
    return this.inventoryService.adjustIngredientStock(
      getRestaurantId(req),
      ingredientId,
      req.user?.userId || null,
      dto,
    );
  }

  @Get('movements')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  listMovements(@Req() req: any, @Query() query: InventoryMovementQueryDto) {
    return this.inventoryService.listMovements(getRestaurantId(req), query);
  }

  @Get('reports/low-stock')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW_LOW_STOCK)
  lowStock(@Req() req: any) {
    return this.inventoryService.lowStockReport(getRestaurantId(req));
  }

  @Get('reports/consumption')
  @RequirePermissions(PERMISSIONS.REPORTS_VIEW)
  consumption(@Req() req: any, @Query() query: ConsumptionReportQueryDto) {
    return this.inventoryService.consumptionReport(getRestaurantId(req), query);
  }
}

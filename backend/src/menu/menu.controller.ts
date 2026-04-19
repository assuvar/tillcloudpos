import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from './menu.service';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from '../products/products.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  throw new ForbiddenException('Restaurant context is required');
};

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get('categories')
  async findCategories(@Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.menuService.findCategoriesWithItems(restaurantId);
  }

  @Get('items')
  async findItems(@Req() req: any, @Query('categoryId') categoryId?: string) {
    const restaurantId = getRestaurantId(req);
    return this.menuService.findItems(restaurantId, categoryId);
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async createCategory(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const restaurantId = getRestaurantId(req);
    if (!body?.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    return this.categoriesService.create({
      name: body.name,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
      restaurantId,
    });
  }

  @Post('items')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  async createItem(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      categoryId?: string;
      price?: number;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
      trackInventory?: boolean;
    },
  ) {
    const restaurantId = getRestaurantId(req);

    if (!body?.name?.trim() || !body?.categoryId) {
      throw new BadRequestException('name and categoryId are required');
    }

    const numericPrice = Number(body.price ?? 0);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      throw new BadRequestException('price must be a non-negative number');
    }

    return this.productsService.create({
      name: body.name,
      categoryId: body.categoryId,
      description: body.description,
      priceInCents: Math.round(numericPrice * 100),
      imageUrl: body.imageUrl,
      isActive: body.isActive,
      trackInventory: body.trackInventory,
      restaurantId,
    });
  }
}

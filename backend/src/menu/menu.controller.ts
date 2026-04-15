import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from './menu.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }

  return 'default-restaurant';
};

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

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
}
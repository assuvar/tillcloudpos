import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantService } from './restaurant.service';

type AuthenticatedRequest = {
  user?: {
    restaurantId: string;
  };
};

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  getCurrent(@Req() req: AuthenticatedRequest) {
    return this.restaurantService.getCurrentRestaurant(req.user?.restaurantId || '');
  }

  @Post()
  createOrUpdate(@Req() req: AuthenticatedRequest, @Body() dto: CreateRestaurantDto) {
    return this.restaurantService.createOrUpdateCurrentRestaurant(
      req.user?.restaurantId || '',
      dto,
    );
  }

  @Patch()
  update(@Req() req: AuthenticatedRequest, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateCurrentRestaurant(req.user?.restaurantId || '', dto);
  }
}

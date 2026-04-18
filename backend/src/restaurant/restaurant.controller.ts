import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantService } from './restaurant.service';

type AuthenticatedRequest = {
  user?: {
    restaurantId: string;
  };
};

const getRestaurantId = (req: AuthenticatedRequest) => {
  const restaurantId = req.user?.restaurantId;
  if (!restaurantId) {
    throw new BadRequestException('Restaurant context is required');
  }
  return restaurantId;
};

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  getCurrent(@Req() req: AuthenticatedRequest) {
    return this.restaurantService.getCurrentRestaurant(getRestaurantId(req));
  }

  @Post()
  createOrUpdate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRestaurantDto,
  ) {
    return this.restaurantService.createOrUpdateCurrentRestaurant(
      getRestaurantId(req),
      dto,
    );
  }

  @Patch()
  update(@Req() req: AuthenticatedRequest, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.updateCurrentRestaurant(getRestaurantId(req), dto);
  }

  @Patch('service-models')
  updateServiceModels(
    @Req() req: AuthenticatedRequest,
    @Body() body: { serviceModels?: string[] },
  ) {
    return this.restaurantService.updateServiceModels(
      getRestaurantId(req),
      body?.serviceModels,
    );
  }

  @Patch('tax')
  updateTax(
    @Req() req: AuthenticatedRequest,
    @Body() body: { taxMode?: 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE'; taxRate?: number },
  ) {
    return this.restaurantService.updateTaxSettings(getRestaurantId(req), {
      taxMode: body?.taxMode,
      taxRate: body?.taxRate,
    });
  }
}

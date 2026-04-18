import { Controller, ForbiddenException, Get, Req } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { KitchenService } from './kitchen.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  throw new ForbiddenException('Restaurant context is required');
};

@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('orders')
  @RequirePermissions(PERMISSIONS.KITCHEN_VIEW)
  getOrders(@Req() req: any) {
    return this.kitchenService.getOrders(getRestaurantId(req));
  }
}

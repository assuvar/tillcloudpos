import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  Req,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CustomersService } from './customers.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }
  throw new ForbiddenException('Restaurant context is required');
};

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CUSTOMERS_VIEW_PROFILES)
  async findAll(@Req() req: any, @Query() query: any) {
    try {
      return await this.customersService.findAll(getRestaurantId(req), query);
    } catch (error) {
      console.error('[CustomersController] Error finding customers:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to load customers');
    }
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMERS_VIEW_PROFILES)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.customersService.findOne(getRestaurantId(req), id);
    } catch (error) {
      console.error('[CustomersController] Error finding customer:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to find customer');
    }
  }

  @Patch(':id/loyalty')
  @RequirePermissions(PERMISSIONS.CUSTOMERS_ADJUST_LOYALTY)
  async adjustLoyalty(
    @Param('id') id: string,
    @Body() body: { pointsChange: number; reason: string },
    @Req() req: any,
  ) {
    try {
      return await this.customersService.adjustLoyaltyPoints(
        getRestaurantId(req),
        id,
        body,
        req.user?.userId,
      );
    } catch (error) {
      console.error('[CustomersController] Error adjusting loyalty:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to adjust loyalty points');
    }
  }
}

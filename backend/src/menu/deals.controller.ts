import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/combos.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }
  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }
  return 'default-restaurant';
};

@Controller('menu/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  create(@Body() dto: CreateDealDto, @Req() req: any) {
    return this.dealsService.create(getRestaurantId(req), dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findAll(@Req() req: any) {
    return this.dealsService.findAll(getRestaurantId(req));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.dealsService.findOne(getRestaurantId(req), id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: CreateDealDto,
    @Req() req: any,
  ) {
    return this.dealsService.update(getRestaurantId(req), id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.dealsService.remove(getRestaurantId(req), id);
  }
}

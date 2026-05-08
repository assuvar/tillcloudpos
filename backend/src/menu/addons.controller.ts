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
import { AddonsService } from './addons.service';
import { CreateAddonGroupDto, AssignModifierDto } from './dto/modifiers.dto';
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

@Controller('menu/addons')
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  @Post('groups')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  create(@Body() dto: CreateAddonGroupDto, @Req() req: any) {
    return this.addonsService.create(getRestaurantId(req), dto);
  }

  @Get('groups')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findAll(@Req() req: any) {
    return this.addonsService.findAll(getRestaurantId(req));
  }

  @Get('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.addonsService.findOne(getRestaurantId(req), id);
  }

  @Put('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: CreateAddonGroupDto,
    @Req() req: any,
  ) {
    return this.addonsService.update(getRestaurantId(req), id, dto);
  }

  @Delete('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.addonsService.remove(getRestaurantId(req), id);
  }

  @Post('groups/:id/assign-item')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  assignToItem(
    @Param('id') id: string,
    @Body() dto: AssignModifierDto,
    @Req() req: any,
  ) {
    return this.addonsService.assignToItem(
      getRestaurantId(req),
      id,
      dto.itemId!,
    );
  }

  @Post('groups/:id/unassign-item')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  unassignFromItem(
    @Param('id') id: string,
    @Body() dto: AssignModifierDto,
    @Req() req: any,
  ) {
    return this.addonsService.unassignFromItem(
      getRestaurantId(req),
      id,
      dto.itemId!,
    );
  }

  @Post('groups/:id/assign-category')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  assignToCategory(
    @Param('id') id: string,
    @Body() dto: AssignModifierDto,
    @Req() req: any,
  ) {
    return this.addonsService.assignToCategory(
      getRestaurantId(req),
      id,
      dto.categoryId!,
    );
  }

  @Post('groups/:id/unassign-category')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  unassignFromCategory(
    @Param('id') id: string,
    @Body() dto: AssignModifierDto,
    @Req() req: any,
  ) {
    return this.addonsService.unassignFromCategory(
      getRestaurantId(req),
      id,
      dto.categoryId!,
    );
  }
}

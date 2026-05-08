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
import { VariationsService } from './variations.service';
import { CreateVariationGroupDto, AssignModifierDto } from './dto/modifiers.dto';
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

@Controller('menu/variations')
export class VariationsController {
  constructor(private readonly variationsService: VariationsService) {}

  @Post('groups')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  create(@Body() dto: CreateVariationGroupDto, @Req() req: any) {
    return this.variationsService.create(getRestaurantId(req), dto);
  }

  @Get('groups')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findAll(@Req() req: any) {
    return this.variationsService.findAll(getRestaurantId(req));
  }

  @Get('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.variationsService.findOne(getRestaurantId(req), id);
  }

  @Put('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: CreateVariationGroupDto,
    @Req() req: any,
  ) {
    return this.variationsService.update(getRestaurantId(req), id, dto);
  }

  @Delete('groups/:id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.variationsService.remove(getRestaurantId(req), id);
  }

  @Post('groups/:id/assign-item')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  assignToItem(
    @Param('id') id: string,
    @Body() dto: AssignModifierDto,
    @Req() req: any,
  ) {
    return this.variationsService.assignToItem(
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
    return this.variationsService.unassignFromItem(
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
    return this.variationsService.assignToCategory(
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
    return this.variationsService.unassignFromCategory(
      getRestaurantId(req),
      id,
      dto.categoryId!,
    );
  }
}

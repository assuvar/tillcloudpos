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
import { GroupsService } from './groups.service';
import { CreateMenuGroupDto } from './dto/combos.dto';
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

@Controller('menu/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  create(@Body() dto: CreateMenuGroupDto, @Req() req: any) {
    return this.groupsService.create(getRestaurantId(req), dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findAll(@Req() req: any) {
    return this.groupsService.findAll(getRestaurantId(req));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(getRestaurantId(req), id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: CreateMenuGroupDto,
    @Req() req: any,
  ) {
    return this.groupsService.update(getRestaurantId(req), id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.remove(getRestaurantId(req), id);
  }
}

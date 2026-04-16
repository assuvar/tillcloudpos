import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { BillsService } from './bills.service';
import {
  AddBillItemDto,
  CreateBillDto,
  UpdateBillItemDto,
} from './dto/create-bill.dto';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }

  return 'default-restaurant';
};

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  create(@Body() dto: CreateBillDto, @Req() req: any) {
    return this.billsService.createBill(
      getRestaurantId(req),
      req.user?.userId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findAll(@Req() req: any, @Query('status') status?: string) {
    return this.billsService.findAll(getRestaurantId(req), status);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.billsService.findOne(id, getRestaurantId(req));
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  addItem(
    @Param('id') id: string,
    @Body() dto: AddBillItemDto,
    @Req() req: any,
  ) {
    return this.billsService.addBillItem(id, getRestaurantId(req), dto);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBillItemDto,
    @Req() req: any,
  ) {
    return this.billsService.updateBillItem(
      id,
      itemId,
      getRestaurantId(req),
      dto,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    return this.billsService.deleteBillItem(id, itemId, getRestaurantId(req));
  }

  @Post(':id/kot')
  @RequirePermissions(PERMISSIONS.KITCHEN_SEND)
  sendToKitchen(@Param('id') id: string, @Req() req: any) {
    return this.billsService.sendToKitchen(id, getRestaurantId(req));
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CompleteOrderDto,
  CreateOrderDto,
  AddOrderItemDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
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

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(
      createOrderDto,
      getRestaurantId(req),
      req.user?.userId,
    );
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  addItem(
    @Param('id') id: string,
    @Body() addOrderItemDto: AddOrderItemDto,
    @Req() req: any,
  ) {
    return this.ordersService.addItem(
      id,
      getRestaurantId(req),
      addOrderItemDto,
    );
  }

  @Post(':id/send-to-kitchen')
  @RequirePermissions(PERMISSIONS.KITCHEN_SEND)
  sendToKitchen(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.sendToKitchen(id, getRestaurantId(req));
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  complete(
    @Param('id') id: string,
    @Body() completeOrderDto: CompleteOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.complete(
      id,
      getRestaurantId(req),
      req.user?.userId,
      completeOrderDto,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findAll(@Req() req: any) {
    return this.ordersService.findAll(getRestaurantId(req));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findOne(id, getRestaurantId(req));
  }

  @Patch(':id/pay')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  pay(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Req() req: any,
  ) {
    return this.ordersService.pay(id, getRestaurantId(req), amount);
  }

  @Patch(':id/close')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  close(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.close(id, getRestaurantId(req));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.update(id, updateOrderDto, getRestaurantId(req));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VOID)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.remove(id, getRestaurantId(req));
  }
}

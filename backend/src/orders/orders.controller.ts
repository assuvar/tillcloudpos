import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BILLING_DISCOUNT)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VOID)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}

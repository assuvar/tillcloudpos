import {
  ForbiddenException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  InternalServerErrorException,
  HttpException,
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

  throw new ForbiddenException('Restaurant context is required');
};

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  async create(@Body() dto: CreateBillDto, @Req() req: any) {
    try {
      const result = await this.billsService.createBill(
        getRestaurantId(req),
        req.user?.userId,
        dto,
      );
      return result;
    } catch (error) {
      console.error('[BillsController] Error creating bill:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create bill');
    }
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const parsedLimit = Number(limit);
      const result = await this.billsService.findAll(
        getRestaurantId(req),
        status,
        Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      );

      return result;
    } catch (error) {
      console.error('[BillsController] Error finding bills:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to load bills');
    }
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BILLING_VIEW_OPEN)
  findOne(@Param('id') id: string, @Req() req: any) {
    try {
      return this.billsService.findOne(id, getRestaurantId(req));
    } catch (error) {
      console.error('[BillsController] Error finding bill:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to find bill');
    }
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  addItem(
    @Param('id') id: string,
    @Body() dto: AddBillItemDto,
    @Req() req: any,
  ) {
    try {
      return this.billsService.addBillItem(id, getRestaurantId(req), dto);
    } catch (error) {
      console.error('[BillsController] Error adding bill item:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to add bill item');
    }
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBillItemDto,
    @Req() req: any,
  ) {
    try {
      return this.billsService.updateBillItem(
        id,
        itemId,
        getRestaurantId(req),
        dto,
      );
    } catch (error) {
      console.error('[BillsController] Error updating bill item:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update bill item');
    }
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.BILLING_CREATE)
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    try {
      return this.billsService.deleteBillItem(id, itemId, getRestaurantId(req));
    } catch (error) {
      console.error('[BillsController] Error deleting bill item:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete bill item');
    }
  }

  @Post(':id/kot')
  @RequirePermissions(PERMISSIONS.KITCHEN_SEND)
  sendToKitchen(@Param('id') id: string, @Req() req: any) {
    try {
      return this.billsService.sendToKitchen(id, getRestaurantId(req));
    } catch (error) {
      console.error('[BillsController] Error sending to kitchen:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to send to kitchen');
    }
  }
}

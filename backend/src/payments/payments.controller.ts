import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CashPaymentDto } from '../bills/dto/cash-payment.dto';
import { PaymentsService } from './payments.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  throw new ForbiddenException('Restaurant context is required');
};

import { ProcessPaymentDto } from './dto/process-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PAYMENTS_CASH)
  process(@Body() dto: ProcessPaymentDto, @Req() req: any) {
    return this.paymentsService.processPayment(getRestaurantId(req), dto, req.user?.userId);
  }
}

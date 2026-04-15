import { Body, Controller, Post, Req } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { CashPaymentDto } from '../bills/dto/cash-payment.dto';
import { PaymentsService } from './payments.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }

  return 'default-restaurant';
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('cash')
  @RequirePermissions(PERMISSIONS.PAYMENTS_CASH)
  cash(@Body() dto: CashPaymentDto, @Req() req: any) {
    return this.paymentsService.cashPayment(getRestaurantId(req), dto);
  }
}

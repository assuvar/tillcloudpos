import { Injectable } from '@nestjs/common';
import { BillsService } from '../bills/bills.service';
import { CashPaymentDto } from '../bills/dto/cash-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly billsService: BillsService) {}

  cashPayment(restaurantId: string, dto: CashPaymentDto) {
    return this.billsService.processCashPayment(restaurantId, dto);
  }
}

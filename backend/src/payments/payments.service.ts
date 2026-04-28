import { Injectable } from '@nestjs/common';
import { BillsService } from '../bills/bills.service';
import { CashPaymentDto } from '../bills/dto/cash-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentMethod, BillStatus } from '../../generated/prisma';

@Injectable()
export class PaymentsService {
  constructor(private readonly billsService: BillsService) {}

  async processPayment(
    restaurantId: string,
    dto: ProcessPaymentDto,
    userId: string,
  ) {
    // For now, we can adapt the cash payment logic or expand for other methods
    // If method is CASH, we use the existing BillsService logic
    if (dto.method === 'CASH') {
      return this.billsService.processCashPayment(restaurantId, {
        billId: dto.orderId,
        amount: dto.amount,
        cashReceived: dto.amount, // Assume exact amount for generic payment call
      });
    }

    // Generic fallback for other methods (simulated)
    return this.billsService.processCashPayment(restaurantId, {
      billId: dto.orderId,
      amount: dto.amount,
      cashReceived: dto.amount,
    });
  }

  cashPayment(restaurantId: string, dto: CashPaymentDto) {
    return this.billsService.processCashPayment(restaurantId, dto);
  }
}

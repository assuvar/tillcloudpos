import { Injectable } from '@nestjs/common';
import { BillsService } from '../bills/bills.service';

@Injectable()
export class KitchenService {
  constructor(private readonly billsService: BillsService) {}

  getOrders(restaurantId: string) {
    return this.billsService.getKitchenOrders(restaurantId);
  }

  updateOrderStatus(restaurantId: string, orderId: string, status: string) {
    return this.billsService.updateKitchenOrderStatus(
      restaurantId,
      orderId,
      status,
    );
  }
}

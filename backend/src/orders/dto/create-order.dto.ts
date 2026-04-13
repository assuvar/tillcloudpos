type SupportedOrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'IN_STORE';

export class CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export class CreateOrderDto {
  items: CreateOrderItemDto[];
  orderType?: SupportedOrderType;
  tableNumber?: string;
}

export class CompleteOrderDto {
  paymentMethod?: string;
}

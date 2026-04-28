export type SupportedOrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'IN_STORE';

export class CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export class CreateOrderDto {
  items?: CreateOrderItemDto[];
  serviceType: SupportedOrderType;
  tableId?: string;
  tableNumber?: string;
  customer?: string;
}

export class AddOrderItemDto {
  productId: string;
  quantity: number;
}

export class CompleteOrderDto {
  paymentMethod?: string;
}

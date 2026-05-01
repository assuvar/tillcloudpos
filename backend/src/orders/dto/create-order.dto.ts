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
  // Customer Details
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;

  // Pickup Details
  pickupName?: string;
  pickupPhone?: string;
  pickupTime?: string;

  // Delivery Details
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliverySuburb?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  deliveryNotes?: string;
  deliveryType?: string;
  paymentType?: string;
}

export class AddOrderItemDto {
  productId: string;
  quantity: number;
}

export class CompleteOrderDto {
  paymentMethod?: string;
}

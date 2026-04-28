type OrderTypeValue = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'IN_STORE';

export class CreateBillDto {
  orderType?: OrderTypeValue;
  tableNumber?: string;
  tableId?: string;
  
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
}

export class AddBillItemDto {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export class UpdateBillItemDto {
  quantity?: number;
  notes?: string;
}

type OrderTypeValue = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'IN_STORE';

export class CreateBillDto {
  orderType?: OrderTypeValue;
  tableNumber?: string;
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

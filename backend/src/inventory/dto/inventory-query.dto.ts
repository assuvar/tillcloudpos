export class InventoryMovementQueryDto {
  ingredientId?: string;
  type?: string;
  limit?: number;
}

export class ConsumptionReportQueryDto {
  days?: number;
}

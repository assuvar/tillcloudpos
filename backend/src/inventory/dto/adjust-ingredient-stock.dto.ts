export type IngredientAdjustMode = 'ADD' | 'REMOVE' | 'SET_FIXED';

export class AdjustIngredientStockDto {
  mode: IngredientAdjustMode;
  quantity: number;
  reason?: string;
}

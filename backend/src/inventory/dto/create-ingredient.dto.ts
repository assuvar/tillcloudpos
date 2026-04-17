export class CreateIngredientDto {
  name: string;
  unit?: string;
  quantity?: number;
  lowStockThreshold?: number;
  conversionRatio?: number;
}

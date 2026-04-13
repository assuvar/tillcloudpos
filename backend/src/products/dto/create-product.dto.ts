export class ProductRecipeItemDto {
  ingredientId: string;
  quantity: number;
}

export class CreateProductDto {
  name: string;
  categoryId: string;
  description?: string;
  priceInCents: number; // Price stored in cents (e.g., 1850 for $18.50)
  imageUrl?: string; // Optional image URL
  trackInventory?: boolean;
  recipeItems?: ProductRecipeItemDto[];
  isActive?: boolean;
  restaurantId: string; // From auth context
}

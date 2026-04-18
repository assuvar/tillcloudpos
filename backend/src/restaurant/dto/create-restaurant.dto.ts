import { IsArray, IsOptional, IsString } from 'class-validator';
import { ALLOWED_SERVICE_MODELS } from '../restaurant.constants';

export class CreateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceModels?: string[];
}

export function validateServiceModelsOrThrow(values: string[] | undefined) {
  if (!values) {
    return;
  }

  const invalid = values.filter(
    (value) => !ALLOWED_SERVICE_MODELS.includes(value as any),
  );
  if (invalid.length > 0) {
    throw new Error(
      `Invalid serviceModels: ${invalid.join(', ')}. Allowed values: ${ALLOWED_SERVICE_MODELS.join(', ')}`,
    );
  }
}

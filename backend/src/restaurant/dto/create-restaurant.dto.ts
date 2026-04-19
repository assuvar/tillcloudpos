import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ALLOWED_SERVICE_MODELS } from '../restaurant.constants';

export class CreateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceModels?: string[];

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  suburb?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  postcode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsIn(['INCLUSIVE', 'EXCLUSIVE', 'NONE'])
  taxMode?: 'INCLUSIVE' | 'EXCLUSIVE' | 'NONE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
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

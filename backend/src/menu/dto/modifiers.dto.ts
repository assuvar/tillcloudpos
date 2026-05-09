import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariationOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  priceInCents: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateVariationGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  type?: string; // SINGLE, MULTIPLE, QUANTITY

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariationOptionDto)
  options?: CreateVariationOptionDto[];
}

export class CreateAddonOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  priceInCents: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateAddonGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  selectionType?: string; // SINGLE, MULTIPLE

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateAddonOptionDto)
  addons?: CreateAddonOptionDto[];
}

export class AssignModifierDto {
  @IsString()
  @IsOptional()
  itemId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

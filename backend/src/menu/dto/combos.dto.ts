import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuGroupItemDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceOverrideInCents?: number;
}

export class CreateMenuGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuGroupItemDto)
  items?: CreateMenuGroupItemDto[];
}

export class CreateDealGroupDto {
  @IsString()
  @IsNotEmpty()
  menuGroupId: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateDealAddonGroupDto {
  @IsString()
  @IsNotEmpty()
  addonGroupId: string;
}

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  priceInCents: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  shortcode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateDealGroupDto)
  groups?: CreateDealGroupDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateDealAddonGroupDto)
  addonGroups?: CreateDealAddonGroupDto[];
}

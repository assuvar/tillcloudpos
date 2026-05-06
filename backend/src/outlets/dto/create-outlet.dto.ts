import { IsString, IsOptional, IsArray, IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateOutletDto {
  @IsString()
  @IsNotEmpty()
  outletNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  abn?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  postcode?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceModels?: string[];
}

export class UpdateOutletDto {
  @IsString()
  @IsOptional()
  outletNumber?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  abn?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  suburb?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  postcode?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceModels?: string[];
}

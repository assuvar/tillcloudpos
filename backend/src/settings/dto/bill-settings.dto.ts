import { IsString, IsOptional, IsBoolean, IsInt, IsUrl } from 'class-validator';

export class UpdateBillSettingsDto {
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsBoolean()
  @IsOptional()
  showLogo?: boolean;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsString()
  @IsOptional()
  footerText?: string;

  @IsBoolean()
  @IsOptional()
  showQrCode?: boolean;

  @IsString()
  @IsOptional()
  qrCodeData?: string;

  @IsString()
  @IsOptional()
  paperSize?: string;

  @IsInt()
  @IsOptional()
  fontSize?: number;

  @IsString()
  @IsOptional()
  alignment?: string;
}

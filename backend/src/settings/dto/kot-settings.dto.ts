import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { KotMode } from '../../../generated/prisma';

export class UpdateKotSettingsDto {
  @IsEnum(KotMode)
  @IsOptional()
  mode?: KotMode;

  @IsBoolean()
  @IsOptional()
  enablePrinting?: boolean;

  @IsBoolean()
  @IsOptional()
  showTableNumber?: boolean;

  @IsBoolean()
  @IsOptional()
  showCustomerName?: boolean;

  @IsBoolean()
  @IsOptional()
  showNotes?: boolean;

  @IsBoolean()
  @IsOptional()
  showOrderType?: boolean;
}

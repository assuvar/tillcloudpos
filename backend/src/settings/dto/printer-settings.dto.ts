import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIP,
} from 'class-validator';
import { PrinterType } from '../../../generated/prisma';

export class CreatePrinterSettingsDto {
  @IsString()
  name: string;

  @IsEnum(PrinterType)
  type: PrinterType;

  @IsString()
  @IsOptional()
  interface?: string;

  @IsIP()
  @IsOptional()
  ipAddress?: string;

  @IsInt()
  @IsOptional()
  port?: number;

  @IsBoolean()
  @IsOptional()
  isBilling?: boolean;

  @IsBoolean()
  @IsOptional()
  isKitchen?: boolean;

  @IsString()
  @IsOptional()
  paperSize?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePrinterSettingsDto extends CreatePrinterSettingsDto {}

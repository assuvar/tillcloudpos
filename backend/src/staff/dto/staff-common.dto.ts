import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StaffRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
}

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^[0-9+()\-\s]{8,20}$/)
  phone?: string;

  @IsEnum(StaffRole)
  role!: StaffRole;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^[0-9+()\-\s]{8,20}$/)
  phone?: string;

  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;
}

export class StaffIdParamDto {
  @IsString()
  @Length(10, 64)
  id!: string;
}

export class ResetStaffPinDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  adminPassword!: string;
}

export class PinAuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

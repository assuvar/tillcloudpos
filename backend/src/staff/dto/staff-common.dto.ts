import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  @IsEmail()
  email!: string;

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

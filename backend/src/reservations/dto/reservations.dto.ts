import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  IsBoolean,
} from 'class-validator';
import { ReservationStatus, Floor } from '../../../generated/prisma';

export class CreateReservationDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  customerName: string;

  @IsString()
  mobile: string; // Map to customerPhone

  @IsInt()
  @Min(1)
  guests: number; // Map to guestCount

  @IsDateString()
  dateTime: string; // Map to reservationTime

  @IsEnum(Floor)
  @IsOptional()
  floor?: Floor;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsOptional()
  @IsString({ each: true })
  tableIds?: string[];

  @IsBoolean()
  @IsOptional()
  mergeRequired?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateReservationDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  guests?: number;

  @IsDateString()
  @IsOptional()
  dateTime?: string;

  @IsEnum(Floor)
  @IsOptional()
  floor?: Floor;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

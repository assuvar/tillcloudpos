import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  IsArray,
} from 'class-validator';
import { TableStatus, Floor } from '../../../generated/prisma';

export class CreateTableGroupDto {
  @IsString()
  name: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateTableGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateTableDto {
  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  seats: number;

  @IsEnum(Floor)
  @IsOptional()
  floor?: Floor;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  seats?: number;

  @IsEnum(Floor)
  @IsOptional()
  floor?: Floor;

  @IsString()
  @IsOptional()
  type?: string;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  activeBillId?: string;

  @IsString()
  @IsOptional()
  currentOrderId?: string;
}

export class ShiftTableDto {
  @IsString()
  targetTableId: string;
}

export class MergeTablesDto {
  @IsArray()
  @IsString({ each: true })
  tableIds: string[];
}

import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  purchaseCost?: number;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  purchaseCost?: number;
}

export class CreateAssignmentDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  condition?: string;
}

export class CreateRepairDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class UpdateRepairDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class QueryAssetDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @TransformType(() => Number)
  page?: number = 1;

  @IsOptional()
  @TransformType(() => Number)
  limit?: number = 10;
}

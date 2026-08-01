import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── QUERY DTO ────────────────────────────────────────────────────

export class QueryProjectProfitabilityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

// ─── CREATE BUDGET ────────────────────────────────────────────────

export class CreateProjectBudgetDto {
  @IsString()
  siteId: string;

  @IsNumber()
  budgetAmount: number;
}

// ─── UPDATE BUDGET ────────────────────────────────────────────────

export class UpdateProjectBudgetDto {
  @IsOptional()
  @IsNumber()
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

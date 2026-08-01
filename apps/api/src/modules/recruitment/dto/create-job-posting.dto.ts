import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobPostingStatus } from '@prisma/client';

// ─── QUERY DTO ────────────────────────────────────────────────────

export class QueryJobPostingDto {
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
  @IsEnum(JobPostingStatus)
  status?: JobPostingStatus;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

// ─── CREATE ───────────────────────────────────────────────────────

export class CreateJobPostingDto {
  @IsString()
  title: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ─── UPDATE ───────────────────────────────────────────────────────

export class UpdateJobPostingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(JobPostingStatus)
  status?: JobPostingStatus;
}

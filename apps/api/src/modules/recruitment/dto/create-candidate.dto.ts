import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CandidateStatus } from '@prisma/client';

// ─── QUERY DTO ────────────────────────────────────────────────────

export class QueryCandidateDto {
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
  jobPostingId?: string;

  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;
}

// ─── CREATE ───────────────────────────────────────────────────────

export class CreateCandidateDto {
  @IsString()
  jobPostingId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── UPDATE ───────────────────────────────────────────────────────

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

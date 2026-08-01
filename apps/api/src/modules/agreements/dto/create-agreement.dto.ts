import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgreementType, AgreementStatus } from '@prisma/client';

// ─── QUERY DTO ────────────────────────────────────────────────────

export class QueryAgreementDto {
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
  @IsEnum(AgreementType)
  type?: AgreementType;

  @IsOptional()
  @IsEnum(AgreementStatus)
  status?: AgreementStatus;
}

// ─── CREATE ───────────────────────────────────────────────────────

export class CreateApprovalStepDto {
  @IsString()
  approverId: string;

  @IsInt()
  step: number;
}

export class CreateAgreementDto {
  @IsString()
  title: string;

  @IsEnum(AgreementType)
  type: AgreementType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  attachments?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalStepDto)
  approvalSteps?: CreateApprovalStepDto[];
}

// ─── UPDATE ───────────────────────────────────────────────────────

export class UpdateAgreementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(AgreementType)
  type?: AgreementType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  attachments?: any;
}

// ─── APPROVE STEP ─────────────────────────────────────────────────

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  comments?: string;
}

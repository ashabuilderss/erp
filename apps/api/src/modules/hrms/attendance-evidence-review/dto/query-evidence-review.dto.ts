import { IsOptional, IsString, IsEnum } from 'class-validator';
import { EvidenceReviewStatus } from '@prisma/client';

export class QueryEvidenceReviewDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(EvidenceReviewStatus)
  status?: EvidenceReviewStatus;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EvidenceReviewStatus } from '@prisma/client';

export class ReviewEvidenceDto {
  @IsEnum(EvidenceReviewStatus, { message: 'Status must be APPROVED, REJECTED, or FLAGGED' })
  status: EvidenceReviewStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

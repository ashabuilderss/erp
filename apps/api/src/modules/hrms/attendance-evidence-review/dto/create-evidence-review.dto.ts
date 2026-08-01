import { IsString, IsOptional } from 'class-validator';

export class CreateEvidenceReviewDto {
  @IsString()
  evidenceId: string;

  @IsOptional()
  @IsString()
  punchId?: string;
}

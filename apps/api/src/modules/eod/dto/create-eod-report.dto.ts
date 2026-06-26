import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { EodReportStatus } from '@prisma/client';

export class CreateEodReportDto {
  @IsDateString()
  reportDate: string;

  @IsString()
  accomplishments: string;

  @IsOptional()
  @IsString()
  challenges?: string;

  @IsOptional()
  @IsString()
  tomorrowPlan?: string;
}

export class UpdateEodReportDto {
  @IsOptional()
  @IsString()
  accomplishments?: string;

  @IsOptional()
  @IsString()
  challenges?: string;

  @IsOptional()
  @IsString()
  tomorrowPlan?: string;

  @IsOptional()
  @IsEnum(EodReportStatus)
  status?: EodReportStatus;

  @IsOptional()
  @IsString()
  reviewedById?: string;
}

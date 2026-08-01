import { IsString, IsDateString, IsOptional, IsEnum, IsArray } from 'class-validator';
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
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

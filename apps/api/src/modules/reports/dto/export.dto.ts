import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from '@prisma/client';

export class CreateExportDto {
  @IsString()
  reportKey!: string;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class ExportResultDto {
  id!: string;
  title!: string;
  format!: ExportFormat;
  status!: string;
  fileUrl?: string;
  csvData?: string;
  bufferBase64?: string;
  mimeType?: string;
  fileExtension?: string;
  summary!: string;
  createdAt!: Date;
}

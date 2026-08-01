import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExportConfigDto {
  @IsString()
  exportType!: string;

  @IsString()
  @IsOptional()
  sheetId?: string;

  @IsString()
  @IsOptional()
  sheetName?: string;

  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean;

  @IsString()
  @IsOptional()
  syncSchedule?: string;

  @IsArray()
  allowedRoles!: string[];

  @IsArray()
  @IsOptional()
  grantedUsers?: string[];
}

export class UpdateExportConfigDto {
  @IsString()
  @IsOptional()
  sheetId?: string;

  @IsString()
  @IsOptional()
  sheetName?: string;

  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean;

  @IsString()
  @IsOptional()
  syncSchedule?: string;

  @IsArray()
  @IsOptional()
  allowedRoles?: string[];

  @IsArray()
  @IsOptional()
  grantedUsers?: string[];
}

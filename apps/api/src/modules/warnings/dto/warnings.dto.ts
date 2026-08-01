import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { WarningCategory, WarningSeverity } from '@prisma/client';

export class IssueWarningDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(WarningCategory)
  category: WarningCategory;

  @IsEnum(WarningSeverity)
  severity: WarningSeverity;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsBoolean()
  @IsOptional()
  isSystemGenerated?: boolean;
}

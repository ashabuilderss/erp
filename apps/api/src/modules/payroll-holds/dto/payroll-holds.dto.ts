import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateIf,
  Min,
} from 'class-validator';
import { PayrollHoldSource, PayrollHoldType } from '@prisma/client';

export class RecommendHoldDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(PayrollHoldSource)
  source: PayrollHoldSource;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsEnum(PayrollHoldType)
  holdType: PayrollHoldType;

  @ValidateIf((o) => o.holdType === PayrollHoldType.PARTIAL_HOLD)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  evidenceUri?: string;
}

export class CreateEmergencyHoldDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(PayrollHoldType)
  holdType: PayrollHoldType;

  @ValidateIf((o) => o.holdType === PayrollHoldType.PARTIAL_HOLD)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ReleaseHoldDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

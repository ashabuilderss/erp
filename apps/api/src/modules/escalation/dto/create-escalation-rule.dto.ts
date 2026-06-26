import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { EscalationTriggerType } from '@prisma/client';

export class CreateEscalationRuleDto {
  @IsString()
  name: string;

  @IsEnum(EscalationTriggerType)
  triggerType: EscalationTriggerType;

  config: Record<string, unknown>;

  @IsNumber()
  @Min(1)
  level: number;

  @IsArray()
  @IsString({ each: true })
  notifyRoles: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEscalationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(EscalationTriggerType)
  triggerType?: EscalationTriggerType;

  @IsOptional()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notifyRoles?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

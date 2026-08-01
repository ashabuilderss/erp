import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActionApprovalDto {
  @IsString()
  @IsOptional()
  comments?: string;
}

export class OverrideApprovalDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateApprovalTemplateStepDto {
  @IsOptional()
  @IsString()
  requiredRoleId?: string;

  @IsOptional()
  @IsString()
  requiredUserId?: string;

  @IsOptional()
  isDirectManager?: boolean;

  @IsOptional()
  slaHours?: number;
}

export class CreateApprovalTemplateDto {
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalTemplateStepDto)
  steps: CreateApprovalTemplateStepDto[];
}

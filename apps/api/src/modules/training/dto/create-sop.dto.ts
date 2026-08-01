import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class CreateSopDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class UpdateSopDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AcknowledgeSopDto {
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class QuerySopDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @TransformType(() => Number)
  page?: number = 1;

  @IsOptional()
  @TransformType(() => Number)
  limit?: number = 10;
}

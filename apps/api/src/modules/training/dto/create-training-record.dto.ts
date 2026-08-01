import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class CreateTrainingRecordDto {
  @IsString()
  employeeId: string;

  @IsString()
  sopDocumentId: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}

export class QueryTrainingRecordDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  sopDocumentId?: string;

  @IsOptional()
  @TransformType(() => Number)
  page?: number = 1;

  @IsOptional()
  @TransformType(() => Number)
  limit?: number = 10;
}

import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type as TransformType } from 'class-transformer';

export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  organizerId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  attendeeIds?: string[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class AddAttendeeDto {
  @IsString()
  employeeId: string;
}

export class MarkAttendanceDto {
  @IsOptional()
  attended?: boolean;
}

export class CreateMinutesDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  recordedById?: string;
}

export class CreateActionItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateActionItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}

export class QueryMeetingDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

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

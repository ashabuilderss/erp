import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { TaskCategory, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  assigneeId: string;

  @IsEnum(TaskCategory)
  category: TaskCategory;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  slaHours?: number;
}

export class ReassignTaskDto {
  @IsString()
  @IsNotEmpty()
  newAssigneeId: string;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class SubmitProofDto {
  @IsString()
  @IsNotEmpty()
  submissionUrl: string;

  @IsString()
  @IsOptional()
  comments?: string;
}

export class ReviewProofDto {
  @IsString()
  @IsOptional()
  comments?: string;
}

export class CreateExtensionDto {
  @IsDateString()
  requestedDueDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

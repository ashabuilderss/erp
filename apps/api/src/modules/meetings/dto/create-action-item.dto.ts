import {
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

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

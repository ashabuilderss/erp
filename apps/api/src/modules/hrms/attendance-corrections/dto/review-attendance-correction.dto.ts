import { IsOptional, IsString } from 'class-validator';

export class ReviewAttendanceCorrectionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

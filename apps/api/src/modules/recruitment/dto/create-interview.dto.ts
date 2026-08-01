import { IsString, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

// ─── SCHEDULE ─────────────────────────────────────────────────────

export class CreateInterviewDto {
  @IsString()
  interviewerId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

// ─── UPDATE ───────────────────────────────────────────────────────

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  interviewerId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

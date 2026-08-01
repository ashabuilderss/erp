import { IsString, IsOptional, IsIn, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadFollowUpDto {
  @ApiProperty({ enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE'], description: 'Type of follow-up' })
  @IsIn(['CALL', 'EMAIL', 'MEETING', 'NOTE'])
  type!: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';

  @ApiPropertyOptional({ description: 'Outcome or result of the follow-up', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  outcome?: string;

  @ApiPropertyOptional({ description: 'Suggested date for next follow-up (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @ApiProperty({ description: 'Notes about the follow-up', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  notes!: string;
}

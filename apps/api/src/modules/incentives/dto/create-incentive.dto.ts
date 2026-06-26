import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { IncentiveStatus, PayoutStatus } from '@prisma/client';

export class CreateIncentiveDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  award: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  opportunityLabel?: string;

  @IsOptional()
  @IsString()
  opportunityType?: string;

  @IsOptional()
  @IsEnum(IncentiveStatus)
  status?: IncentiveStatus;

  @IsOptional()
  @IsString()
  winnerId?: string;

  @IsOptional()
  @IsEnum(PayoutStatus)
  payoutStatus?: PayoutStatus;
}

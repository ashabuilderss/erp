import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { IncentiveStatus, PayoutStatus } from '@prisma/client';

export class UpdateIncentiveDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  award?: string;

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

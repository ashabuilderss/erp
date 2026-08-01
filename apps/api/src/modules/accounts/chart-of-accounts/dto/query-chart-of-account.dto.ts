import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AccountType } from '@prisma/client';

export class QueryChartOfAccountDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @IsOptional()
  @IsString()
  search?: string;
}

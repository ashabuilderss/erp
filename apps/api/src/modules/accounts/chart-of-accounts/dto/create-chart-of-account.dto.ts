import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateChartOfAccountDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

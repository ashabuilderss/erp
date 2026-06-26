import {
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { ExpenseStatus } from '@prisma/client';

export class CreateExpenseClaimDto {
  @IsNumber()
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class UpdateExpenseClaimDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

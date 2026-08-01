import { IsEnum, IsNotEmpty } from 'class-validator';
import { CommissionStatus } from '@prisma/client';

export class UpdateCommissionStatusDto {
  @IsEnum(CommissionStatus)
  @IsNotEmpty()
  status: CommissionStatus;
}

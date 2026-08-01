import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  @IsNotEmpty()
  status: LeadStatus;

  @ValidateIf((o) => o.status === LeadStatus.LOST)
  @IsString()
  @IsNotEmpty({ message: 'lostReason is required when status is LOST' })
  lostReason?: string;
}

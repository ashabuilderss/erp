import { IsEnum } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class UpdatePropertyStatusDto {
  @IsEnum(PropertyStatus)
  status: PropertyStatus;
}

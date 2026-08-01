import { IsEnum, IsNotEmpty } from 'class-validator';
import { SiteVisitStatus } from '@prisma/client';

export class UpdateSiteVisitStatusDto {
  @IsEnum(SiteVisitStatus)
  @IsNotEmpty()
  status: SiteVisitStatus;
}

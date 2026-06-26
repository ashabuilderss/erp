import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSiteVisitDto } from './create-site-visit.dto';

export class UpdateSiteVisitDto extends PartialType(
  OmitType(CreateSiteVisitDto, ['status'] as const),
) {}

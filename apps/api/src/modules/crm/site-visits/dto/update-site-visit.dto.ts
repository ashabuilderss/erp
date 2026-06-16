import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteVisitDto } from './create-site-visit.dto';

export class UpdateSiteVisitDto extends PartialType(CreateSiteVisitDto) {}

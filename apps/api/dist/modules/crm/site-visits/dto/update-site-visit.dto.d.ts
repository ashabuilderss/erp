import { CreateSiteVisitDto } from './create-site-visit.dto';
declare const UpdateSiteVisitDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateSiteVisitDto, "status">>>;
export declare class UpdateSiteVisitDto extends UpdateSiteVisitDto_base {
}
export {};

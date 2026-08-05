import { CreateLeadDto } from './create-lead.dto';
declare const UpdateLeadDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateLeadDto, "status">>>;
export declare class UpdateLeadDto extends UpdateLeadDto_base {
}
export {};

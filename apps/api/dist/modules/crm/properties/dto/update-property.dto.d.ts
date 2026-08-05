import { CreatePropertyDto } from './create-property.dto';
declare const UpdatePropertyDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreatePropertyDto, "status">>>;
export declare class UpdatePropertyDto extends UpdatePropertyDto_base {
}
export {};

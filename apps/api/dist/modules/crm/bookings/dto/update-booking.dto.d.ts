import { CreateBookingDto } from './create-booking.dto';
declare const UpdateBookingDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateBookingDto, "status" | "paymentStatus">>>;
export declare class UpdateBookingDto extends UpdateBookingDto_base {
}
export {};

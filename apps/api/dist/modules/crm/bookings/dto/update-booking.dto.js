"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBookingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_booking_dto_1 = require("./create-booking.dto");
class UpdateBookingDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_booking_dto_1.CreateBookingDto, ['status', 'paymentStatus'])) {
}
exports.UpdateBookingDto = UpdateBookingDto;
//# sourceMappingURL=update-booking.dto.js.map
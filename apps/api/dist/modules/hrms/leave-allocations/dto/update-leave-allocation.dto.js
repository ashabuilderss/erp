"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeaveAllocationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_leave_allocation_dto_1 = require("./create-leave-allocation.dto");
class UpdateLeaveAllocationDto extends (0, mapped_types_1.PartialType)(create_leave_allocation_dto_1.CreateLeaveAllocationDto) {
}
exports.UpdateLeaveAllocationDto = UpdateLeaveAllocationDto;
//# sourceMappingURL=update-leave-allocation.dto.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDesignationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_designation_dto_1 = require("./create-designation.dto");
class UpdateDesignationDto extends (0, mapped_types_1.PartialType)(create_designation_dto_1.CreateDesignationDto) {
}
exports.UpdateDesignationDto = UpdateDesignationDto;
//# sourceMappingURL=update-designation.dto.js.map
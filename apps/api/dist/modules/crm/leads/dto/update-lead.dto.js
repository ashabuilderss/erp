"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeadDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_lead_dto_1 = require("./create-lead.dto");
class UpdateLeadDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_lead_dto_1.CreateLeadDto, ['status'])) {
}
exports.UpdateLeadDto = UpdateLeadDto;
//# sourceMappingURL=update-lead.dto.js.map
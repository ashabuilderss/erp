"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSiteVisitDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_site_visit_dto_1 = require("./create-site-visit.dto");
class UpdateSiteVisitDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_site_visit_dto_1.CreateSiteVisitDto, ['status'])) {
}
exports.UpdateSiteVisitDto = UpdateSiteVisitDto;
//# sourceMappingURL=update-site-visit.dto.js.map
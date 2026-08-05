"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChartOfAccountDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_chart_of_account_dto_1 = require("./create-chart-of-account.dto");
class UpdateChartOfAccountDto extends (0, mapped_types_1.PartialType)(create_chart_of_account_dto_1.CreateChartOfAccountDto) {
}
exports.UpdateChartOfAccountDto = UpdateChartOfAccountDto;
//# sourceMappingURL=update-chart-of-account.dto.js.map
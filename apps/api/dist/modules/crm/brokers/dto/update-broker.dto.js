"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBrokerDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_broker_dto_1 = require("./create-broker.dto");
class UpdateBrokerDto extends (0, mapped_types_1.PartialType)(create_broker_dto_1.CreateBrokerDto) {
}
exports.UpdateBrokerDto = UpdateBrokerDto;
//# sourceMappingURL=update-broker.dto.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePermissionGrantsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const permissions_1 = require("../../../common/auth/permissions");
class PermissionGrantEntry {
    permission;
    granted;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(Object.values(permissions_1.Permissions)),
    __metadata("design:type", String)
], PermissionGrantEntry.prototype, "permission", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PermissionGrantEntry.prototype, "granted", void 0);
class UpdatePermissionGrantsDto {
    grants;
}
exports.UpdatePermissionGrantsDto = UpdatePermissionGrantsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PermissionGrantEntry),
    __metadata("design:type", Array)
], UpdatePermissionGrantsDto.prototype, "grants", void 0);
//# sourceMappingURL=update-permission-grants.dto.js.map
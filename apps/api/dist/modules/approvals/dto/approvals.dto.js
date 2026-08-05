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
exports.CreateApprovalTemplateDto = exports.CreateApprovalTemplateStepDto = exports.OverrideApprovalDto = exports.ActionApprovalDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ActionApprovalDto {
    comments;
}
exports.ActionApprovalDto = ActionApprovalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActionApprovalDto.prototype, "comments", void 0);
class OverrideApprovalDto {
    reason;
}
exports.OverrideApprovalDto = OverrideApprovalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OverrideApprovalDto.prototype, "reason", void 0);
class CreateApprovalTemplateStepDto {
    requiredRoleId;
    requiredUserId;
    isDirectManager;
    slaHours;
}
exports.CreateApprovalTemplateStepDto = CreateApprovalTemplateStepDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalTemplateStepDto.prototype, "requiredRoleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateApprovalTemplateStepDto.prototype, "requiredUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateApprovalTemplateStepDto.prototype, "isDirectManager", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateApprovalTemplateStepDto.prototype, "slaHours", void 0);
class CreateApprovalTemplateDto {
    entityType;
    description;
    steps;
}
exports.CreateApprovalTemplateDto = CreateApprovalTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateApprovalTemplateDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateApprovalTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateApprovalTemplateStepDto),
    __metadata("design:type", Array)
], CreateApprovalTemplateDto.prototype, "steps", void 0);
//# sourceMappingURL=approvals.dto.js.map
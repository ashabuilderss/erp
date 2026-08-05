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
exports.ArchiveAnnouncementDto = exports.PublishAnnouncementDto = exports.CreateAnnouncementDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAnnouncementDto {
    title;
    body;
    priority;
    targetRoles;
    targetEmployees;
    expiresAt;
}
exports.CreateAnnouncementDto = CreateAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Announcement title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Announcement body text' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Priority level',
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target roles', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAnnouncementDto.prototype, "targetRoles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target employee IDs', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAnnouncementDto.prototype, "targetEmployees", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expiration date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAnnouncementDto.prototype, "expiresAt", void 0);
class PublishAnnouncementDto {
    announcementId;
}
exports.PublishAnnouncementDto = PublishAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Announcement ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishAnnouncementDto.prototype, "announcementId", void 0);
class ArchiveAnnouncementDto {
    announcementId;
}
exports.ArchiveAnnouncementDto = ArchiveAnnouncementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Announcement ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ArchiveAnnouncementDto.prototype, "announcementId", void 0);
//# sourceMappingURL=create-announcement.dto.js.map
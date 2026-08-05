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
exports.LogDocumentAccessDto = exports.DeleteDocumentDto = exports.RegisterDocumentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterDocumentDto {
    name;
    fileType;
    fileSize;
    category;
    storageObjectId;
    accessLevel;
}
exports.RegisterDocumentDto = RegisterDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDocumentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File type (e.g., pdf, docx)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDocumentDto.prototype, "fileType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File size in bytes' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RegisterDocumentDto.prototype, "fileSize", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Document category' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDocumentDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'StorageObject ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDocumentDto.prototype, "storageObjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Access level' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDocumentDto.prototype, "accessLevel", void 0);
class DeleteDocumentDto {
    documentId;
}
exports.DeleteDocumentDto = DeleteDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteDocumentDto.prototype, "documentId", void 0);
class LogDocumentAccessDto {
    documentId;
    action;
}
exports.LogDocumentAccessDto = LogDocumentAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogDocumentAccessDto.prototype, "documentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Action type (e.g., VIEW, DOWNLOAD)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LogDocumentAccessDto.prototype, "action", void 0);
//# sourceMappingURL=document.dto.js.map
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
exports.RecordTransferDto = exports.RecordWastageDto = exports.RecordOutwardDto = exports.RecordInwardDto = exports.RecordTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class RecordTransactionDto {
    type;
    quantity;
    siteFromId;
    siteToId;
}
exports.RecordTransactionDto = RecordTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.InventoryTransactionType, description: 'Transaction type' }),
    (0, class_validator_1.IsEnum)(client_1.InventoryTransactionType),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity for this transaction' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordTransactionDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source site ID (required for TRANSFER)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "siteFromId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Destination site ID (required for TRANSFER)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransactionDto.prototype, "siteToId", void 0);
class RecordInwardDto {
    quantity;
}
exports.RecordInwardDto = RecordInwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity received' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordInwardDto.prototype, "quantity", void 0);
class RecordOutwardDto {
    quantity;
}
exports.RecordOutwardDto = RecordOutwardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity dispatched' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordOutwardDto.prototype, "quantity", void 0);
class RecordWastageDto {
    quantity;
}
exports.RecordWastageDto = RecordWastageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity wasted' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordWastageDto.prototype, "quantity", void 0);
class RecordTransferDto {
    quantity;
    siteFromId;
    siteToId;
}
exports.RecordTransferDto = RecordTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity to transfer' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordTransferDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source site ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransferDto.prototype, "siteFromId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Destination site ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordTransferDto.prototype, "siteToId", void 0);
//# sourceMappingURL=record-transaction.dto.js.map
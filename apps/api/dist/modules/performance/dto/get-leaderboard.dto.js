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
exports.GetLeaderboardDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class GetLeaderboardDto {
    period;
    periodType;
    limit;
}
exports.GetLeaderboardDto = GetLeaderboardDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetLeaderboardDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.PerformancePeriod }),
    (0, class_validator_1.IsEnum)(client_1.PerformancePeriod),
    __metadata("design:type", String)
], GetLeaderboardDto.prototype, "periodType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetLeaderboardDto.prototype, "limit", void 0);
//# sourceMappingURL=get-leaderboard.dto.js.map
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceScoreController = void 0;
const common_1 = require("@nestjs/common");
const performance_service_1 = require("./performance.service");
const calculate_score_dto_1 = require("./dto/calculate-score.dto");
const rate_employee_dto_1 = require("./dto/rate-employee.dto");
const get_trends_dto_1 = require("./dto/get-trends.dto");
const get_leaderboard_dto_1 = require("./dto/get-leaderboard.dto");
const list_scores_dto_1 = require("./dto/list-scores.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let PerformanceScoreController = class PerformanceScoreController {
    performanceService;
    constructor(performanceService) {
        this.performanceService = performanceService;
    }
    async calculateScore(dto, companyId, userId) {
        const scoreId = await this.performanceService.calculateScore({
            companyId,
            employeeId: dto.employeeId,
            period: dto.period,
            periodType: dto.periodType,
            calculatedById: dto.calculatedById ?? userId,
        });
        return this.performanceService.getScore(scoreId, companyId);
    }
    async rateEmployee(dto, companyId, userId) {
        const ratingId = await this.performanceService.rateEmployee({
            companyId,
            performanceScoreId: dto.performanceScoreId,
            ratedById: dto.ratedById ?? userId,
            score: dto.score,
            comment: dto.comment,
        });
        return { id: ratingId };
    }
    async getTrends(query, companyId) {
        return this.performanceService.getTrends({
            companyId,
            employeeId: query.employeeId,
            periodType: query.periodType,
            limit: query.limit,
        });
    }
    async getLeaderboard(query, companyId) {
        return this.performanceService.getLeaderboard({
            companyId,
            period: query.period,
            periodType: query.periodType,
            limit: query.limit,
        });
    }
    async listScores(query, companyId) {
        return this.performanceService.listScores(companyId, {
            page: query.page,
            limit: query.limit,
            employeeId: query.employeeId,
            periodType: query.periodType,
            period: query.period,
        });
    }
    async getScore(id, companyId) {
        return this.performanceService.getScore(id, companyId);
    }
    async recalculateScore(dto, companyId, userId) {
        const scoreId = await this.performanceService.recalculateScore(companyId, dto.employeeId, dto.period, dto.periodType, dto.calculatedById ?? userId);
        return this.performanceService.getScore(scoreId, companyId);
    }
};
exports.PerformanceScoreController = PerformanceScoreController;
__decorate([
    (0, common_1.Post)('calculate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_CALCULATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_score_dto_1.CalculateScoreDto, String, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "calculateScore", null);
__decorate([
    (0, common_1.Post)('rate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_RATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rate_employee_dto_1.RateEmployeeDto, String, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "rateEmployee", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_TREND),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_trends_dto_1.GetTrendsDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_LEADERBOARD),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_leaderboard_dto_1.GetLeaderboardDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_scores_dto_1.ListScoresDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "listScores", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "getScore", null);
__decorate([
    (0, common_1.Post)('recalculate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PERFORMANCE_CALCULATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_score_dto_1.CalculateScoreDto, String, String]),
    __metadata("design:returntype", Promise)
], PerformanceScoreController.prototype, "recalculateScore", null);
exports.PerformanceScoreController = PerformanceScoreController = __decorate([
    (0, common_1.Controller)('performance-scores'),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceScoreController);
//# sourceMappingURL=performance.controller.js.map
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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const performance_service_1 = require("./performance.service");
const create_performance_dto_1 = require("./dto/create-performance.dto");
const update_performance_dto_1 = require("./dto/update-performance.dto");
const query_performance_dto_1 = require("./dto/query-performance.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let PerformanceController = class PerformanceController {
    performanceService;
    constructor(performanceService) {
        this.performanceService = performanceService;
    }
    async getMyPerformance(employeeId, companyId) {
        return this.performanceService.getEmployeePerformance(employeeId, companyId);
    }
    async create(dto, companyId) {
        return this.performanceService.create(dto, companyId);
    }
    async findAll(query, companyId) {
        return this.performanceService.findAll(query, companyId);
    }
    async getAverage(companyId, year, quarter) {
        return this.performanceService.getAverageScore(companyId, year, quarter);
    }
    async getByEmployee(employeeId, companyId, currentEmployeeId, role, year) {
        const resolvedId = role === 'EMPLOYEE' ? currentEmployeeId : employeeId;
        return this.performanceService.getEmployeePerformance(resolvedId, companyId, year);
    }
    async findOne(id, companyId) {
        return this.performanceService.findOne(id, companyId);
    }
    async update(id, dto, companyId) {
        return this.performanceService.update(id, dto, companyId);
    }
    async remove(id, companyId) {
        return this.performanceService.remove(id, companyId);
    }
};
exports.PerformanceController = PerformanceController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getMyPerformance", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_performance_dto_1.CreatePerformanceDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_performance_dto_1.QueryPerformanceDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('average'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('quarter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getAverage", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String, Number]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "getByEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_performance_dto_1.UpdatePerformanceDto, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PerformanceController.prototype, "remove", null);
exports.PerformanceController = PerformanceController = __decorate([
    (0, common_1.Controller)('performance'),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceController);
//# sourceMappingURL=performance.controller.js.map
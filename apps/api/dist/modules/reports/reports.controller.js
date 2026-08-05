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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const export_orchestration_service_1 = require("./export-orchestration.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const permissions_1 = require("../../common/auth/permissions");
let ReportsController = class ReportsController {
    service;
    orchestration;
    constructor(service, orchestration) {
        this.service = service;
        this.orchestration = orchestration;
    }
    async getCatalog() {
        return this.service.getCatalog();
    }
    async getKPIDashboard(dto, companyId, userRole, employeeId) {
        return this.service.getKPIDashboard({ userRole, employeeId, companyId }, dto);
    }
    async getPipelineFunnel(dto, companyId, userRole, employeeId) {
        return this.service.getPipelineFunnel({ userRole, employeeId, companyId }, dto);
    }
    async getTrends(dto, companyId, userRole, employeeId) {
        return this.service.getTrends({ userRole, employeeId, companyId }, dto);
    }
    async getLeaderboard(companyId, userRole, employeeId) {
        return this.service.getLeaderboard({ userRole, employeeId, companyId });
    }
    async getExports(query, companyId) {
        return this.service.getExports(companyId, query.page, query.limit);
    }
    async getExportHistory(query, companyId) {
        return this.orchestration.getExportHistory(companyId, query.page, query.limit);
    }
    async createExport(dto, companyId, userId, userRole, generatedById) {
        return this.service.createExport(dto, companyId, generatedById);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('catalog'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.REPORT_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Get)('kpi-dashboard'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANALYTICS_VIEW),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAnalyticsDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getKPIDashboard", null);
__decorate([
    (0, common_1.Get)('pipeline-funnel'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANALYTICS_VIEW),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAnalyticsDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPipelineFunnel", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANALYTICS_VIEW),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAnalyticsDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.ANALYTICS_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('exports'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.REPORT_VIEW, permissions_1.Permissions.REPORT_EXPORT),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryReportExportDto, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExports", null);
__decorate([
    (0, common_1.Get)('export-history'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_HISTORY),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryReportExportDto, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExportHistory", null);
__decorate([
    (0, common_1.Post)('exports'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.REPORT_EXPORT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(4, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateReportExportDto, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "createExport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        export_orchestration_service_1.ExportOrchestrationService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map
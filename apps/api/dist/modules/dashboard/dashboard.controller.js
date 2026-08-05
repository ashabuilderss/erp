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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const owner_dashboard_service_1 = require("./owner-dashboard.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
let DashboardController = class DashboardController {
    legacyService;
    ownerDashboardService;
    constructor(legacyService, ownerDashboardService) {
        this.legacyService = legacyService;
        this.ownerDashboardService = ownerDashboardService;
    }
    async getOwnerMetrics(companyId, dateStr) {
        return this.legacyService.getMetricsSnapshot(companyId, dateStr);
    }
    async getOwnerKpi(companyId, dateStr) {
        return this.ownerDashboardService.getKpiSnapshot(companyId, dateStr);
    }
    async getOwnerAlerts(companyId, limitStr) {
        const limit = limitStr ? parseInt(limitStr, 10) : 20;
        return this.ownerDashboardService.getRecentAlerts(companyId, limit);
    }
    async getOwnerHistory(companyId, daysStr) {
        const days = daysStr ? parseInt(daysStr, 10) : 30;
        return this.ownerDashboardService.getSnapshotHistory(companyId, days);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('owner/metrics'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DASHBOARD_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOwnerMetrics", null);
__decorate([
    (0, common_1.Get)('owner/kpi'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DASHBOARD_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOwnerKpi", null);
__decorate([
    (0, common_1.Get)('owner/alerts'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DASHBOARD_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOwnerAlerts", null);
__decorate([
    (0, common_1.Get)('owner/history'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.DASHBOARD_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOwnerHistory", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        owner_dashboard_service_1.OwnerDashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map
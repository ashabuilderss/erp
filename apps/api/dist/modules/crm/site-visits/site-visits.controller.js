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
exports.SiteVisitsController = void 0;
const common_1 = require("@nestjs/common");
const site_visits_service_1 = require("./site-visits.service");
const create_site_visit_dto_1 = require("./dto/create-site-visit.dto");
const update_site_visit_dto_1 = require("./dto/update-site-visit.dto");
const query_site_visit_dto_1 = require("./dto/query-site-visit.dto");
const update_site_visit_status_dto_1 = require("./dto/update-site-visit-status.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
let SiteVisitsController = class SiteVisitsController {
    siteVisitsService;
    constructor(siteVisitsService) {
        this.siteVisitsService = siteVisitsService;
    }
    async create(dto, companyId, role, employeeId) {
        return this.siteVisitsService.create(dto, companyId, role, employeeId ?? undefined);
    }
    async findAll(query, companyId, employeeId, role) {
        return this.siteVisitsService.findAll(query, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async findOne(id, companyId, employeeId, role) {
        return this.siteVisitsService.findOne(id, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async update(id, dto, companyId, employeeId, role) {
        return this.siteVisitsService.update(id, dto, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId), role, employeeId ?? undefined);
    }
    async updateStatus(id, dto, companyId, employeeId, role) {
        return this.siteVisitsService.updateStatus(id, dto.status, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId), role, employeeId ?? undefined);
    }
    async remove(id, companyId) {
        return this.siteVisitsService.remove(id, companyId);
    }
};
exports.SiteVisitsController = SiteVisitsController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_site_visit_dto_1.CreateSiteVisitDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_site_visit_dto_1.QuerySiteVisitDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_site_visit_dto_1.UpdateSiteVisitDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_site_visit_status_dto_1.UpdateSiteVisitStatusDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.SITE_VISIT_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SiteVisitsController.prototype, "remove", null);
exports.SiteVisitsController = SiteVisitsController = __decorate([
    (0, common_1.Controller)('site-visits'),
    __metadata("design:paramtypes", [site_visits_service_1.SiteVisitsService])
], SiteVisitsController);
//# sourceMappingURL=site-visits.controller.js.map
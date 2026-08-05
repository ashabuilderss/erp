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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const query_lead_dto_1 = require("./dto/query-lead.dto");
const update_lead_status_dto_1 = require("./dto/update-lead-status.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const cache_decorators_1 = require("../../../common/decorators/cache.decorators");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
const scope_helper_util_1 = require("../../../common/utils/scope-helper.util");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    async getMyLeads(employeeId, companyId) {
        return this.leadsService.getMyLeads(employeeId, companyId);
    }
    async create(dto, companyId, role, employeeId) {
        return this.leadsService.create(dto, companyId, role, employeeId ?? undefined);
    }
    async findAll(query, companyId, employeeId, scopes, teamId, departmentId) {
        const scopeFilter = (0, scope_helper_util_1.getEffectiveScopeFilter)(scopes, permissions_1.Permissions.LEAD_READ, {
            companyId,
            employeeId,
            teamId,
            departmentId,
        });
        return this.leadsService.findAll(query, scopeFilter);
    }
    async findOne(id, companyId, employeeId, scopes, teamId, departmentId) {
        const scopeFilter = (0, scope_helper_util_1.getEffectiveScopeFilter)(scopes, permissions_1.Permissions.LEAD_READ, {
            companyId,
            employeeId,
            teamId,
            departmentId,
        });
        return this.leadsService.findOne(id, scopeFilter);
    }
    async update(id, dto, companyId, employeeId, scopes, role, teamId, departmentId) {
        const scopeFilter = (0, scope_helper_util_1.getEffectiveScopeFilter)(scopes, permissions_1.Permissions.LEAD_UPDATE, {
            companyId,
            employeeId,
            teamId,
            departmentId,
        });
        return this.leadsService.update(id, dto, companyId, scopeFilter, role, employeeId ?? undefined);
    }
    async updateStatus(id, dto, companyId, employeeId, scopes, role, teamId, departmentId) {
        const scopeFilter = (0, scope_helper_util_1.getEffectiveScopeFilter)(scopes, permissions_1.Permissions.LEAD_UPDATE, {
            companyId,
            employeeId,
            teamId,
            departmentId,
        });
        return this.leadsService.updateStatus(id, dto.status, companyId, scopeFilter, role, employeeId ?? undefined, dto.lostReason);
    }
    async convertToCustomer(id, companyId, employeeId, scopes, teamId, departmentId) {
        const scopeFilter = (0, scope_helper_util_1.getEffectiveScopeFilter)(scopes, permissions_1.Permissions.LEAD_CONVERT, {
            companyId,
            employeeId,
            teamId,
            departmentId,
        });
        return this.leadsService.convertToCustomer(id, scopeFilter);
    }
    async remove(id, companyId) {
        return this.leadsService.remove(id, companyId);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "getMyLeads", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('scopes')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('teamId')),
    __param(5, (0, current_user_decorator_1.CurrentUser)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_lead_dto_1.QueryLeadDto, String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('scopes')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('teamId')),
    __param(5, (0, current_user_decorator_1.CurrentUser)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('scopes')),
    __param(5, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(6, (0, current_user_decorator_1.CurrentUser)('teamId')),
    __param(7, (0, current_user_decorator_1.CurrentUser)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_dto_1.UpdateLeadDto, String, Object, Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('scopes')),
    __param(5, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(6, (0, current_user_decorator_1.CurrentUser)('teamId')),
    __param(7, (0, current_user_decorator_1.CurrentUser)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_status_dto_1.UpdateLeadStatusDto, String, Object, Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_CONVERT),
    (0, cache_decorators_1.CacheInvalidateExtra)(['leads', 'customers', 'properties']),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('scopes')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('teamId')),
    __param(5, (0, current_user_decorator_1.CurrentUser)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "convertToCustomer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.LEAD_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "remove", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map
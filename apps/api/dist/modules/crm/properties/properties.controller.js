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
exports.PropertiesController = void 0;
const common_1 = require("@nestjs/common");
const properties_service_1 = require("./properties.service");
const create_property_dto_1 = require("./dto/create-property.dto");
const update_property_dto_1 = require("./dto/update-property.dto");
const update_property_status_dto_1 = require("./dto/update-property-status.dto");
const query_property_dto_1 = require("./dto/query-property.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
const role_scope_util_1 = require("../../../common/utils/role-scope.util");
let PropertiesController = class PropertiesController {
    propertiesService;
    constructor(propertiesService) {
        this.propertiesService = propertiesService;
    }
    async getMyProperties(employeeId, companyId) {
        return this.propertiesService.getMyProperties(employeeId, companyId);
    }
    async create(dto, companyId, role, employeeId) {
        return this.propertiesService.create(dto, companyId, role, employeeId ?? undefined);
    }
    async findAll(query, companyId, employeeId, role) {
        return this.propertiesService.findAll(query, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async findOne(id, companyId, employeeId, role) {
        return this.propertiesService.findOne(id, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId));
    }
    async update(id, dto, companyId, employeeId, role) {
        return this.propertiesService.update(id, dto, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId), role, employeeId ?? undefined);
    }
    async updateStatus(id, dto, companyId, employeeId, role) {
        return this.propertiesService.updateStatus(id, dto.status, companyId, (0, role_scope_util_1.getScopedEmployeeId)(role, employeeId), role, employeeId ?? undefined);
    }
    async remove(id, companyId) {
        return this.propertiesService.remove(id, companyId);
    }
};
exports.PropertiesController = PropertiesController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_READ),
    __param(0, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "getMyProperties", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_property_dto_1.CreatePropertyDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_property_dto_1.QueryPropertyDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_property_dto_1.UpdatePropertyDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_property_status_dto_1.UpdatePropertyStatusDto, String, Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROPERTY_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PropertiesController.prototype, "remove", null);
exports.PropertiesController = PropertiesController = __decorate([
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [properties_service_1.PropertiesService])
], PropertiesController);
//# sourceMappingURL=properties.controller.js.map
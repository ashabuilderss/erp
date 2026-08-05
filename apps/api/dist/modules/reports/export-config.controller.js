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
exports.ExportConfigController = void 0;
const common_1 = require("@nestjs/common");
const export_config_service_1 = require("./export-config.service");
const export_config_dto_1 = require("./dto/export-config.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const permissions_1 = require("../../common/auth/permissions");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let ExportConfigController = class ExportConfigController {
    service;
    constructor(service) {
        this.service = service;
    }
    async list(companyId) {
        return this.service.list(companyId);
    }
    async getById(companyId, id) {
        return this.service.getById(companyId, id);
    }
    async create(companyId, dto) {
        return this.service.create(companyId, dto);
    }
    async update(companyId, id, dto) {
        return this.service.update(companyId, id, dto);
    }
    async remove(companyId, id) {
        return this.service.remove(companyId, id);
    }
};
exports.ExportConfigController = ExportConfigController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_CONFIG_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExportConfigController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_CONFIG_READ),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExportConfigController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_CONFIG_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, export_config_dto_1.CreateExportConfigDto]),
    __metadata("design:returntype", Promise)
], ExportConfigController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_CONFIG_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, export_config_dto_1.UpdateExportConfigDto]),
    __metadata("design:returntype", Promise)
], ExportConfigController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EXPORT_CONFIG_MANAGE),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExportConfigController.prototype, "remove", null);
exports.ExportConfigController = ExportConfigController = __decorate([
    (0, common_1.Controller)('reports/export-configs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.ACCOUNTS),
    __metadata("design:paramtypes", [export_config_service_1.ExportConfigService])
], ExportConfigController);
//# sourceMappingURL=export-config.controller.js.map
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
exports.CommissionController = void 0;
const common_1 = require("@nestjs/common");
const commission_service_1 = require("./commission.service");
const create_commission_dto_1 = require("./dto/create-commission.dto");
const query_commission_dto_1 = require("./dto/query-commission.dto");
const update_commission_status_dto_1 = require("./dto/update-commission-status.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const cache_decorators_1 = require("../../common/decorators/cache.decorators");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let CommissionController = class CommissionController {
    commissionService;
    constructor(commissionService) {
        this.commissionService = commissionService;
    }
    async create(dto, companyId) {
        return this.commissionService.create(dto, companyId);
    }
    async findAll(query, companyId) {
        return this.commissionService.findAll(query, companyId);
    }
    async findOne(id, companyId) {
        return this.commissionService.findOne(id, companyId);
    }
    async updateStatus(id, dto, companyId) {
        return this.commissionService.updateStatus(id, dto.status, companyId);
    }
};
exports.CommissionController = CommissionController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMMISSION_UPDATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_commission_dto_1.CreateCommissionDto, String]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, cache_decorators_1.NoCache)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMMISSION_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_commission_dto_1.QueryCommissionDto, String]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, cache_decorators_1.NoCache)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMMISSION_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.COMMISSION_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_commission_status_dto_1.UpdateCommissionStatusDto, String]),
    __metadata("design:returntype", Promise)
], CommissionController.prototype, "updateStatus", null);
exports.CommissionController = CommissionController = __decorate([
    (0, common_1.Controller)('commissions'),
    __metadata("design:paramtypes", [commission_service_1.CommissionService])
], CommissionController);
//# sourceMappingURL=commission.controller.js.map
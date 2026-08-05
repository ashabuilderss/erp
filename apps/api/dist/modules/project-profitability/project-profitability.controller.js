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
exports.ProjectProfitabilityController = void 0;
const common_1 = require("@nestjs/common");
const project_profitability_service_1 = require("./project-profitability.service");
const create_project_budget_dto_1 = require("./dto/create-project-budget.dto");
const create_cost_entry_dto_1 = require("./dto/create-cost-entry.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let ProjectProfitabilityController = class ProjectProfitabilityController {
    profitabilityService;
    constructor(profitabilityService) {
        this.profitabilityService = profitabilityService;
    }
    async getSummary(companyId) {
        return this.profitabilityService.getSummary(companyId);
    }
    async findAll(companyId, query) {
        return this.profitabilityService.findAll(companyId, query);
    }
    async create(companyId, dto) {
        return this.profitabilityService.create(dto, companyId);
    }
    async findOne(companyId, id) {
        return this.profitabilityService.findOne(id, companyId);
    }
    async update(companyId, id, dto) {
        return this.profitabilityService.update(id, dto, companyId);
    }
    async listCostEntries(companyId, id) {
        return this.profitabilityService.listCostEntries(id, companyId);
    }
    async addCostEntry(companyId, id, dto) {
        return this.profitabilityService.addCostEntry(id, dto, companyId);
    }
    async deleteCostEntry(companyId, entryId) {
        return this.profitabilityService.deleteCostEntry(entryId, companyId);
    }
};
exports.ProjectProfitabilityController = ProjectProfitabilityController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_project_budget_dto_1.QueryProjectProfitabilityDto]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_project_budget_dto_1.CreateProjectBudgetDto]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_project_budget_dto_1.UpdateProjectBudgetDto]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/entries'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "listCostEntries", null);
__decorate([
    (0, common_1.Post)(':id/entries'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_cost_entry_dto_1.CreateCostEntryDto]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "addCostEntry", null);
__decorate([
    (0, common_1.Delete)('entries/:entryId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.PROFITABILITY_VIEW),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectProfitabilityController.prototype, "deleteCostEntry", null);
exports.ProjectProfitabilityController = ProjectProfitabilityController = __decorate([
    (0, common_1.Controller)('project-profitability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [project_profitability_service_1.ProjectProfitabilityService])
], ProjectProfitabilityController);
//# sourceMappingURL=project-profitability.controller.js.map
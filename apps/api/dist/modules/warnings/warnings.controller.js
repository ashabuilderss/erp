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
exports.WarningsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const warnings_service_1 = require("./warnings.service");
const warnings_dto_1 = require("./dto/warnings.dto");
const query_warning_dto_1 = require("./dto/query-warning.dto");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let WarningsController = class WarningsController {
    warningsService;
    constructor(warningsService) {
        this.warningsService = warningsService;
    }
    async issueWarning(req, dto) {
        return await this.warningsService.issueWarning(req.user.companyId, req.user.id, dto);
    }
    async findAll(req, query) {
        return await this.warningsService.findAll(req.user.companyId, query);
    }
    async findMyWarnings(req, query) {
        return await this.warningsService.findMyWarnings(req.user.companyId, req.user.id, query);
    }
    async findOne(id, req) {
        return await this.warningsService.findOne(req.user.companyId, id);
    }
    async acknowledgeWarning(id, req) {
        return await this.warningsService.acknowledgeWarning(req.user.companyId, id, req.user.id);
    }
};
exports.WarningsController = WarningsController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.WARNING_CREATE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, warnings_dto_1.IssueWarningDto]),
    __metadata("design:returntype", Promise)
], WarningsController.prototype, "issueWarning", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.WARNING_READ),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_warning_dto_1.QueryWarningDto]),
    __metadata("design:returntype", Promise)
], WarningsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.WARNING_READ),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_warning_dto_1.QueryWarningDto]),
    __metadata("design:returntype", Promise)
], WarningsController.prototype, "findMyWarnings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.WARNING_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarningsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.WARNING_ACKNOWLEDGE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarningsController.prototype, "acknowledgeWarning", null);
exports.WarningsController = WarningsController = __decorate([
    (0, common_1.Controller)('warnings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [warnings_service_1.WarningsService])
], WarningsController);
//# sourceMappingURL=warnings.controller.js.map
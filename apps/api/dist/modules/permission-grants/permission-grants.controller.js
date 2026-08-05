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
exports.PermissionGrantsController = void 0;
const common_1 = require("@nestjs/common");
const permission_grants_service_1 = require("./permission-grants.service");
const update_permission_grants_dto_1 = require("./dto/update-permission-grants.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let PermissionGrantsController = class PermissionGrantsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(companyId) {
        return this.service.findAll(companyId);
    }
    async findByUser(userId, companyId) {
        return this.service.findByUser(userId, companyId);
    }
    async updateUserGrants(userId, dto, currentUserId, companyId) {
        return this.service.updateUserGrants(userId, dto, currentUserId, companyId);
    }
};
exports.PermissionGrantsController = PermissionGrantsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionGrantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PermissionGrantsController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Patch)('user/:userId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_permission_grants_dto_1.UpdatePermissionGrantsDto, String, String]),
    __metadata("design:returntype", Promise)
], PermissionGrantsController.prototype, "updateUserGrants", null);
exports.PermissionGrantsController = PermissionGrantsController = __decorate([
    (0, common_1.Controller)('permission-grants'),
    __metadata("design:paramtypes", [permission_grants_service_1.PermissionGrantsService])
], PermissionGrantsController);
//# sourceMappingURL=permission-grants.controller.js.map
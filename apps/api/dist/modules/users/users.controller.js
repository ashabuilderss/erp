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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const query_user_dto_1 = require("./dto/query-user.dto");
const update_preferences_dto_1 = require("./dto/update-preferences.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const require_2fa_decorator_1 = require("../../common/decorators/require-2fa.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(query, companyId) {
        return this.usersService.findAll(query, companyId);
    }
    async findOne(id, companyId) {
        return this.usersService.findOne(id, companyId);
    }
    async update(id, dto, companyId, currentUserId, currentUserRole) {
        if (currentUserRole !== client_1.UserRole.OWNER && dto.role) {
            if (dto.role === client_1.UserRole.OWNER || dto.role === client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only OWNER can assign OWNER or ADMIN roles');
            }
        }
        if (currentUserRole !== client_1.UserRole.OWNER && id === currentUserId && dto.role) {
            throw new common_1.ForbiddenException('Cannot change your own role');
        }
        if (currentUserRole !== client_1.UserRole.OWNER) {
            const target = await this.usersService.findOne(id, companyId);
            if (target.role === client_1.UserRole.OWNER || target.role === client_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only OWNER can modify ADMIN or OWNER users');
            }
        }
        if (currentUserRole === client_1.UserRole.OWNER && id === currentUserId && dto.role) {
            throw new common_1.ForbiddenException('Cannot change your own role');
        }
        return this.usersService.update(id, dto, companyId);
    }
    async remove(id, companyId, currentUserId, currentUserRole) {
        if (id === currentUserId) {
            throw new common_1.ForbiddenException('Cannot deactivate your own account');
        }
        if (currentUserRole !== client_1.UserRole.OWNER) {
            const target = await this.usersService.findOne(id, companyId);
            if (target.role === client_1.UserRole.OWNER) {
                throw new common_1.ForbiddenException('Cannot deactivate an OWNER account');
            }
        }
        return this.usersService.remove(id, companyId);
    }
    async updatePreferences(dto, userId) {
        return this.usersService.updatePreferences(userId, dto);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.OWNER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.USER_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_user_dto_1.QueryUserDto, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.USER_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.USER_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(4, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.USER_DELETE),
    (0, require_2fa_decorator_1.Require2FA)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('me/preferences'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_preferences_dto_1.UpdatePreferencesDto, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePreferences", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map
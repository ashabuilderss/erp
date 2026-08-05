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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const create_employee_with_user_dto_1 = require("./dto/create-employee-with-user.dto");
const login_dto_1 = require("./dto/login.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const LOGIN_THROTTLE_LIMIT = Number(process.env.AUTH_LOGIN_THROTTLE_LIMIT ?? 30);
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async precheck(dto) {
        return this.authService.precheck(dto.email, dto.password);
    }
    async login(dto, req) {
        const headers = req.headers;
        const forwarded = headers['x-forwarded-for'];
        const realIp = headers['x-real-ip'];
        return this.authService.login(dto.email, dto.password, this.getIpAddress(req));
    }
    getIpAddress(req) {
        const headers = req.headers;
        const forwarded = headers['x-forwarded-for'];
        const realIp = headers['x-real-ip'];
        return ((Array.isArray(forwarded) ? forwarded[0] : forwarded)
            ?.split(',')[0]
            ?.trim() ||
            (Array.isArray(realIp) ? realIp[0] : realIp) ||
            'unknown');
    }
    async refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    async logout(req) {
        await this.authService.revokeAllUserTokens(req.user.id);
        return { success: true };
    }
    async createEmployeeWithUser(dto, req) {
        return this.authService.createEmployeeWithUser(dto, req.user.companyId, req.user.role);
    }
    async getMe(req) {
        const employee = await this.authService.getEmployeeByUserId(req.user.id);
        const user = await this.authService.getFullUser(req.user.id);
        const permissions = await this.authService.getEffectivePermissions(req.user.id, req.user.role);
        return {
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
                isActive: true,
                totpEnabled: user?.totpEnabled ?? false,
            },
            company: req.company ? {
                id: req.company.id,
                name: req.company.name,
                slug: req.company.slug,
            } : null,
            employee: employee
                ? { id: employee.id, employeeCode: employee.employeeCode }
                : null,
            permissions,
        };
    }
    async changePassword(dto, req) {
        return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword, { totpToken: dto.totpToken, ipAddress: this.getIpAddress(req) });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('precheck'),
    (0, roles_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: LOGIN_THROTTLE_LIMIT, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "precheck", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, roles_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: LOGIN_THROTTLE_LIMIT, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, roles_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('employees/with-user'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_with_user_dto_1.CreateEmployeeWithUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createEmployeeWithUser", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
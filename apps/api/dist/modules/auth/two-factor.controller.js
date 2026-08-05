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
exports.TwoFactorController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const two_factor_service_1 = require("./two-factor.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const two_factor_dto_1 = require("./dto/two-factor.dto");
let TwoFactorController = class TwoFactorController {
    twoFactorService;
    constructor(twoFactorService) {
        this.twoFactorService = twoFactorService;
    }
    async setup(user) {
        return this.twoFactorService.setup(user.id);
    }
    async verify(user, dto) {
        return this.twoFactorService.verify(user.id, dto.token);
    }
    async disable(user, dto) {
        return this.twoFactorService.disable(user.id, dto.password);
    }
    async backupCodes(user) {
        return this.twoFactorService.generateBackupCodes(user.id);
    }
    async authenticate(dto) {
        return this.twoFactorService.authenticate(dto.tempToken, dto.code);
    }
};
exports.TwoFactorController = TwoFactorController;
__decorate([
    (0, common_1.Post)('setup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, two_factor_dto_1.VerifyTwoFactorDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('disable'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, two_factor_dto_1.DisableTwoFactorDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "disable", null);
__decorate([
    (0, common_1.Post)('backup-codes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "backupCodes", null);
__decorate([
    (0, common_1.Post)('authenticate'),
    (0, roles_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [two_factor_dto_1.AuthenticateTwoFactorDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "authenticate", null);
exports.TwoFactorController = TwoFactorController = __decorate([
    (0, common_1.Controller)('auth/2fa'),
    __metadata("design:paramtypes", [two_factor_service_1.TwoFactorService])
], TwoFactorController);
//# sourceMappingURL=two-factor.controller.js.map
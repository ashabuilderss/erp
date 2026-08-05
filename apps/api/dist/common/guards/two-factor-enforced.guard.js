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
var TwoFactorEnforcedGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorEnforcedGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const require_2fa_decorator_1 = require("../decorators/require-2fa.decorator");
const PRIVILEGED_ROLES = [
    client_1.UserRole.OWNER,
    client_1.UserRole.ADMIN,
    client_1.UserRole.ACCOUNTS,
];
let TwoFactorEnforcedGuard = TwoFactorEnforcedGuard_1 = class TwoFactorEnforcedGuard {
    reflector;
    prisma;
    logger = new common_1.Logger(TwoFactorEnforcedGuard_1.name);
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(require_2fa_decorator_1.REQUIRE_2FA_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.id || !user?.role) {
            return true;
        }
        if (!PRIVILEGED_ROLES.includes(user.role)) {
            return true;
        }
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { totpEnabled: true, email: true },
        });
        if (!dbUser) {
            return true;
        }
        if (!dbUser.totpEnabled) {
            this.logger.warn(`2FA enforcement blocked privileged action for ${dbUser.email} (role=${user.role})`);
            throw new common_1.ForbiddenException('Two-factor authentication is required for this action. ' +
                'Please enroll in 2FA first via POST /api/auth/2fa/setup, then verify with /api/auth/2fa/verify.');
        }
        return true;
    }
};
exports.TwoFactorEnforcedGuard = TwoFactorEnforcedGuard;
exports.TwoFactorEnforcedGuard = TwoFactorEnforcedGuard = TwoFactorEnforcedGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], TwoFactorEnforcedGuard);
//# sourceMappingURL=two-factor-enforced.guard.js.map
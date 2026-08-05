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
var SecurityEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../config/prisma.service");
let SecurityEventListener = SecurityEventListener_1 = class SecurityEventListener {
    prisma;
    logger = new common_1.Logger(SecurityEventListener_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleLoginSuccess(payload) {
        try {
            await this.prisma.securityEvent.create({
                data: {
                    companyId: payload.companyId,
                    eventType: 'LOGIN_SUCCESS',
                    severity: 'INFO',
                    description: `Successful login for ${payload.email}`,
                    userId: payload.userId,
                    ipAddress: payload.ipAddress,
                    metadata: { email: payload.email },
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to log login success', err);
        }
    }
    async handleLoginFailure(payload) {
        try {
            const user = await this.prisma.user.findFirst({
                where: { email: payload.email },
                select: { id: true, companyId: true },
            });
            if (!user)
                return;
            await this.prisma.securityEvent.create({
                data: {
                    companyId: user.companyId,
                    eventType: 'LOGIN_FAILURE',
                    severity: 'WARNING',
                    description: payload.reason ?? `Failed login attempt for ${payload.email}`,
                    userId: user.id,
                    ipAddress: payload.ipAddress,
                    metadata: { email: payload.email, reason: payload.reason },
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to log login failure', err);
        }
    }
    async handlePasswordChange(payload) {
        try {
            await this.prisma.securityEvent.create({
                data: {
                    companyId: payload.companyId,
                    eventType: 'PASSWORD_CHANGE',
                    severity: 'INFO',
                    description: 'Password changed',
                    userId: payload.userId,
                    metadata: {},
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to log password change', err);
        }
    }
    async handlePasswordChangeFailure(payload) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.userId },
                select: { email: true },
            });
            await this.prisma.securityEvent.create({
                data: {
                    companyId: payload.companyId,
                    eventType: 'PASSWORD_CHANGE_FAILURE',
                    severity: 'WARNING',
                    description: `Failed password change attempt for ${user?.email ?? payload.userId}: ${payload.reason ?? 'unknown'}`,
                    userId: payload.userId,
                    ipAddress: payload.ipAddress,
                    metadata: { reason: payload.reason },
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to log password change failure', err);
        }
    }
    async handleUnauthorized(payload) {
        try {
            await this.prisma.securityEvent.create({
                data: {
                    companyId: payload.companyId,
                    eventType: 'UNAUTHORIZED_ACCESS',
                    severity: 'WARNING',
                    description: `Unauthorized ${payload.method} ${payload.path}`,
                    userId: payload.userId,
                    metadata: { path: payload.path, method: payload.method },
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to log unauthorized access', err);
        }
    }
};
exports.SecurityEventListener = SecurityEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)('security.login.success'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityEventListener.prototype, "handleLoginSuccess", null);
__decorate([
    (0, event_emitter_1.OnEvent)('security.login.failure'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityEventListener.prototype, "handleLoginFailure", null);
__decorate([
    (0, event_emitter_1.OnEvent)('security.password.change'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityEventListener.prototype, "handlePasswordChange", null);
__decorate([
    (0, event_emitter_1.OnEvent)('security.password.change.failure'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityEventListener.prototype, "handlePasswordChangeFailure", null);
__decorate([
    (0, event_emitter_1.OnEvent)('security.unauthorized'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityEventListener.prototype, "handleUnauthorized", null);
exports.SecurityEventListener = SecurityEventListener = SecurityEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecurityEventListener);
//# sourceMappingURL=security-event-listener.js.map
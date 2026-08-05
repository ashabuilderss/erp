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
var PermissionsGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../config/prisma.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const permissions_1 = require("../auth/permissions");
const rbac_service_1 = require("../rbac/rbac.service");
let PermissionsGuard = PermissionsGuard_1 = class PermissionsGuard {
    reflector;
    prisma;
    rbacService;
    eventEmitter;
    logger = new common_1.Logger(PermissionsGuard_1.name);
    constructor(reflector, prisma, rbacService, eventEmitter) {
        this.reflector = reflector;
        this.prisma = prisma;
        this.rbacService = rbacService;
        this.eventEmitter = eventEmitter;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const role = request.user?.role;
        const userId = request.user?.id;
        const companyId = request.user?.companyId;
        if (!userId || !companyId) {
            if (role === client_1.UserRole.OWNER)
                return true;
            throw new common_1.ForbiddenException('Missing user context for permissions check');
        }
        const userContext = { id: userId, companyId, role };
        const useLegacy = process.env.USE_LEGACY_RBAC !== 'false';
        let legacyAllowed = false;
        if (role === client_1.UserRole.OWNER) {
            legacyAllowed = true;
        }
        else {
            const rolePermissions = (0, permissions_1.getPermissionsForRole)(role);
            const grants = await this.prisma.permissionGrant.findMany({
                where: { userId },
                select: { permission: true, granted: true },
            });
            const effectivePermissions = (0, permissions_1.mergePermissionsWithGrants)(rolePermissions, grants);
            legacyAllowed = requiredPermissions.every((p) => effectivePermissions.includes(p));
        }
        let rbacAllowed = true;
        const scopes = {};
        for (const perm of requiredPermissions) {
            const result = await this.rbacService.checkPermission(userContext, perm);
            if (result.effect !== 'ALLOW') {
                rbacAllowed = false;
            }
            if (result.scope) {
                scopes[perm] = result.scope;
            }
        }
        if (useLegacy && legacyAllowed !== rbacAllowed) {
            this.logger.warn(`Shadow Mode Anomaly: Legacy allowed=${legacyAllowed}, RbacService allowed=${rbacAllowed} for user ${userId} on ${requiredPermissions.join(', ')}`);
        }
        const isAllowed = useLegacy ? legacyAllowed : rbacAllowed;
        if (!isAllowed) {
            if (requiredPermissions.some(p => p.startsWith('quotation:'))) {
                this.eventEmitter.emit('security.unauthorized', {
                    userId: userId,
                    companyId: companyId,
                    path: request.url,
                    method: request.method,
                });
            }
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        request.user.scopes = scopes;
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = PermissionsGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService,
        rbac_service_1.RbacService,
        event_emitter_1.EventEmitter2])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map
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
var RbacService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const redis_service_1 = require("../../config/redis.service");
const client_1 = require("@prisma/client");
let RbacService = RbacService_1 = class RbacService {
    prisma;
    redis;
    logger = new common_1.Logger(RbacService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async checkPermission(user, permissionAction) {
        if (user.role === client_1.UserRole.OWNER) {
            return { effect: 'ALLOW', scope: client_1.PermissionScope.OWNER_ONLY };
        }
        const cacheKey = `rbac:company:${user.companyId}:user:${user.id}:matrix`;
        let matrix = await this.redis.get(cacheKey);
        if (!matrix) {
            matrix = await this.compileUserMatrix(user.id, user.companyId);
            await this.redis.set(cacheKey, matrix, 3600);
        }
        const result = matrix[permissionAction];
        if (!result) {
            return { effect: 'DENY' };
        }
        return result;
    }
    async compileUserMatrix(userId, companyId) {
        const matrix = {};
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: true },
        });
        if (!user || user.companyId !== companyId) {
            return matrix;
        }
        if (user.roles?.name?.toUpperCase() === 'OWNER') {
            const allPermissions = await this.prisma.permission.findMany();
            for (const perm of allPermissions) {
                matrix[perm.action] = {
                    effect: 'ALLOW',
                    scope: client_1.PermissionScope.OWNER_ONLY,
                };
            }
            return matrix;
        }
        if (user.roleId) {
            const rolePermissions = await this.prisma.rolePermission.findMany({
                where: { roleId: user.roleId },
                include: { permissions: true },
            });
            for (const rp of rolePermissions) {
                matrix[rp.permissions.action] = { effect: 'ALLOW', scope: rp.scope };
            }
        }
        const userPermissions = await this.prisma.userPermission.findMany({
            where: { userId },
            include: { permissions: true },
        });
        for (const up of userPermissions) {
            if (up.effect === client_1.PermissionEffect.DENY) {
                matrix[up.permissions.action] = { effect: 'DENY' };
            }
            else if (up.effect === client_1.PermissionEffect.ALLOW) {
                matrix[up.permissions.action] = { effect: 'ALLOW', scope: up.scope };
            }
        }
        return matrix;
    }
    async invalidateMatrix(userId, companyId) {
        const cacheKey = `rbac:company:${companyId}:user:${userId}:matrix`;
        await this.redis.del(cacheKey);
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = RbacService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map
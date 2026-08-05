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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGrantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const permissions_1 = require("../../common/auth/permissions");
let PermissionGrantsService = class PermissionGrantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId) {
        return this.prisma.permissionGrant.findMany({
            where: { companyId },
            include: {
                usersPermissionGrantsUserIdTousers: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }
    async findByUser(userId, companyId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, companyId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const grants = await this.prisma.permissionGrant.findMany({
            where: { userId },
        });
        return {
            userId,
            role: user.role,
            allPermissions: Object.values(permissions_1.Permissions),
            grants: grants.map((g) => ({
                permission: g.permission,
                granted: g.granted,
            })),
        };
    }
    async updateUserGrants(userId, dto, currentUserId, companyId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, companyId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === 'OWNER' && userId !== currentUserId) {
            throw new common_1.ForbiddenException('Cannot modify another OWNER grants');
        }
        await this.prisma.$transaction(dto.grants.map((g) => this.prisma.permissionGrant.upsert({
            where: {
                companyId_userId_permission: {
                    companyId,
                    userId,
                    permission: g.permission,
                },
            },
            update: { granted: g.granted, grantedById: currentUserId },
            create: {
                userId,
                permission: g.permission,
                granted: g.granted,
                grantedById: currentUserId,
                companyId,
            },
        })));
        return this.findByUser(userId, companyId);
    }
};
exports.PermissionGrantsService = PermissionGrantsService;
exports.PermissionGrantsService = PermissionGrantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionGrantsService);
//# sourceMappingURL=permission-grants.service.js.map
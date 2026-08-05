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
exports.SecurityEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let SecurityEventsService = class SecurityEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.securityEvent.create({
            data: {
                companyId: data.companyId,
                eventType: data.eventType,
                severity: data.severity,
                description: data.description ?? '',
                userId: data.userId,
                metadata: (data.metadata ?? {}),
                ipAddress: data.ipAddress,
            },
        });
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 20, eventType, severity } = query;
        const where = { companyId };
        if (eventType)
            where.eventType = eventType;
        if (severity)
            where.severity = severity;
        const [data, total] = await Promise.all([
            this.prisma.securityEvent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.securityEvent.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findLoginHistory(companyId) {
        const events = await this.prisma.securityEvent.findMany({
            where: {
                companyId,
                eventType: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_ATTEMPT'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return {
            data: events.map((e) => {
                const metadata = e.metadata;
                return {
                    id: e.id,
                    email: metadata && typeof metadata === 'object' && 'email' in metadata
                        ? String(metadata.email)
                        : (e.userId ?? 'unknown'),
                    status: e.eventType === 'LOGIN_SUCCESS' ? 'success' : 'failed',
                    reason: e.description ?? null,
                    createdAt: e.createdAt.toISOString(),
                };
            }),
            meta: { total: events.length },
        };
    }
    async findSessions(companyId) {
        const tokens = await this.prisma.refreshToken.findMany({
            where: { companyId, revokedAt: null, expiresAt: { gte: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { users: { select: { email: true } } },
        });
        return tokens.map((t) => ({
            id: t.id,
            email: t.users?.email ?? 'unknown',
            createdAt: t.createdAt.toISOString(),
        }));
    }
};
exports.SecurityEventsService = SecurityEventsService;
exports.SecurityEventsService = SecurityEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecurityEventsService);
//# sourceMappingURL=security-events.service.js.map
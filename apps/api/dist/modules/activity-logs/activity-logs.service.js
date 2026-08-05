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
exports.ActivityLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ActivityLogsService = class ActivityLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 20, search, action, entityType, performedById, } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { entityType: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { actorEmail: { contains: search, mode: 'insensitive' } },
                { actorName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (entityType)
            where.entityType = entityType;
        if (performedById)
            where.performedById = performedById;
        const [data, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employees: {
                        include: { users: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.prisma.activityLog.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async exportAll(query, companyId) {
        const { search, action, entityType, performedById } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { entityType: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { actorEmail: { contains: search, mode: 'insensitive' } },
                { actorName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (entityType)
            where.entityType = entityType;
        if (performedById)
            where.performedById = performedById;
        return this.prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { employees: { include: { users: true } } },
        });
    }
};
exports.ActivityLogsService = ActivityLogsService;
exports.ActivityLogsService = ActivityLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityLogsService);
//# sourceMappingURL=activity-logs.service.js.map
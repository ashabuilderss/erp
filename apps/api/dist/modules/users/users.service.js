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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../config/prisma.service");
const sort_by_1 = require("../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'email',
    'firstName',
    'lastName',
    'role',
    'isActive',
];
let UsersService = class UsersService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    notificationPreferences: true,
                    employees: {
                        select: {
                            id: true,
                            employeeCode: true,
                            departments: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const user = await this.prisma.user.findFirst({
            where: { id, companyId },
            include: {
                employees: { include: { departments: true, designations: true } },
            },
        });
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        return user;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        const updated = await this.prisma.user.update({
            where: { id },
            data: dto,
            include: {
                employees: { select: { id: true, employeeCode: true } },
            },
        });
        this.eventEmitter.emit('user.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        this.eventEmitter.emit('user.updated', { companyId, entityId: id });
        return updated;
    }
    async updatePreferences(userId, dto) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true },
        });
        const current = existing?.notificationPreferences ??
            {};
        const merged = { ...current, ...dto };
        return this.prisma.user.update({
            where: { id: userId },
            data: { notificationPreferences: merged },
            select: { notificationPreferences: true },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], UsersService);
//# sourceMappingURL=users.service.js.map
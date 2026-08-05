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
exports.BrokersService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'name',
    'email',
    'companyName',
];
let BrokersService = class BrokersService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async create(dto, companyId) {
        if (dto.email) {
            const existing = await this.prisma.broker.findFirst({
                where: { companyId, email: dto.email, deletedAt: null },
            });
            if (existing) {
                throw new common_1.ConflictException('A broker with this email already exists');
            }
        }
        const broker = await this.prisma.broker.create({
            data: {
                companyId,
                name: dto.name,
                companyName: dto.companyName,
                phone: dto.phone,
                email: dto.email,
                commissionRate: dto.commissionRate,
                isActive: dto.isActive ?? true,
            },
        });
        this.eventEmitter.emit('broker.created', { companyId, entityId: broker.id });
        return broker;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', isActive, } = query;
        const where = { companyId, deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        const [data, total] = await Promise.all([
            this.prisma.broker.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.broker.count({ where }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, companyId) {
        const broker = await this.prisma.broker.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { leads: true },
        });
        if (!broker) {
            throw new common_1.NotFoundException(`Broker with ID ${id} not found`);
        }
        return broker;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        if (dto.email) {
            const existing = await this.prisma.broker.findFirst({
                where: { companyId, email: dto.email, deletedAt: null, id: { not: id } },
            });
            if (existing) {
                throw new common_1.ConflictException('A broker with this email already exists');
            }
        }
        const updated = await this.prisma.broker.update({
            where: { id },
            data: dto,
        });
        this.eventEmitter.emit('broker.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.broker.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        this.eventEmitter.emit('broker.deleted', { companyId, entityId: id });
        return { success: true };
    }
};
exports.BrokersService = BrokersService;
exports.BrokersService = BrokersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], BrokersService);
//# sourceMappingURL=brokers.service.js.map
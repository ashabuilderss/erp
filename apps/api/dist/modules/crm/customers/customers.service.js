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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'name',
    'email',
    'type',
];
let CustomersService = class CustomersService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async create(dto, userId, companyId) {
        const employee = await this.prisma.employee.findUnique({
            where: { userId },
        });
        const customer = await this.prisma.customer.create({
            data: {
                ...dto,
                companyId,
                createdById: employee?.id ?? null,
            },
            include: {
                employees: {
                    include: { users: true },
                },
            },
        });
        this.eventEmitter.emit('customer.created', {
            companyId,
            entityId: customer.id,
        });
        return customer;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, type, createdById, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (type)
            where.type = type;
        if (createdById)
            where.createdById = createdById;
        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employees: {
                        include: { users: true },
                    },
                },
            }),
            this.prisma.customer.count({ where }),
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
        const customer = await this.prisma.customer.findFirst({
            where: { id, companyId },
            include: {
                employees: {
                    include: { users: true },
                },
                leads: true,
                siteVisits: true,
                bookings: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        return customer;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        const updated = await this.prisma.customer.update({
            where: { id },
            data: dto,
            include: {
                employees: {
                    include: { users: true },
                },
            },
        });
        this.eventEmitter.emit('customer.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('customer.deleted', { companyId, entityId: id });
        return { success: true };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], CustomersService);
//# sourceMappingURL=customers.service.js.map
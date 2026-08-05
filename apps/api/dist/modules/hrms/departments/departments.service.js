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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = ['createdAt', 'updatedAt', 'name'];
let DepartmentsService = class DepartmentsService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async create(dto, companyId) {
        const department = await this.prisma.department.create({
            data: { ...dto, companyId },
        });
        this.eventEmitter.emit('department.created', {
            companyId,
            entityId: department.id,
        });
        return department;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.department.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    designations: true,
                    _count: { select: { employees: true } },
                },
            }),
            this.prisma.department.count({ where }),
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
        const department = await this.prisma.department.findFirst({
            where: { id, companyId },
            include: {
                designations: true,
                employees: { include: { users: true, designations: true } },
                _count: { select: { employees: true } },
            },
        });
        if (!department) {
            throw new common_1.NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        const updated = await this.prisma.department.update({
            where: { id },
            data: dto,
            include: {
                designations: true,
                _count: { select: { employees: true } },
            },
        });
        this.eventEmitter.emit('department.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('department.deleted', { companyId, entityId: id });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map
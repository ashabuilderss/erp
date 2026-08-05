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
exports.DesignationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = ['createdAt', 'updatedAt', 'name'];
let DesignationsService = class DesignationsService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async create(dto, companyId) {
        const department = await this.prisma.department.findUnique({
            where: { id: dto.departmentId },
        });
        if (!department) {
            throw new common_1.BadRequestException(`Department with ID ${dto.departmentId} not found`);
        }
        if (department.companyId !== companyId) {
            throw new common_1.BadRequestException(`Department with ID ${dto.departmentId} does not belong to this company`);
        }
        const designation = await this.prisma.designation.create({
            data: { ...dto, companyId },
            include: { departments: true },
        });
        this.eventEmitter.emit('designation.created', {
            companyId,
            entityId: designation.id,
        });
        return designation;
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, departmentId, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (departmentId) {
            where.departmentId = departmentId;
        }
        const [data, total] = await Promise.all([
            this.prisma.designation.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: { departments: true, _count: { select: { employees: true } } },
            }),
            this.prisma.designation.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const designation = await this.prisma.designation.findFirst({
            where: { id, companyId },
            include: { departments: true, employees: { include: { users: true } } },
        });
        if (!designation) {
            throw new common_1.NotFoundException(`Designation with ID ${id} not found`);
        }
        return designation;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        if (dto.departmentId) {
            const department = await this.prisma.department.findUnique({
                where: { id: dto.departmentId },
            });
            if (!department) {
                throw new common_1.BadRequestException(`Department with ID ${dto.departmentId} not found`);
            }
            if (department.companyId !== companyId) {
                throw new common_1.BadRequestException(`Department with ID ${dto.departmentId} does not belong to this company`);
            }
        }
        const updated = await this.prisma.designation.update({
            where: { id },
            data: dto,
            include: { departments: true, _count: { select: { employees: true } } },
        });
        this.eventEmitter.emit('designation.updated', { companyId, entityId: id });
        return updated;
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        await this.prisma.designation.update({ where: { id }, data: { deletedAt: new Date() } });
        this.eventEmitter.emit('designation.deleted', { companyId, entityId: id });
    }
};
exports.DesignationsService = DesignationsService;
exports.DesignationsService = DesignationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], DesignationsService);
//# sourceMappingURL=designations.service.js.map
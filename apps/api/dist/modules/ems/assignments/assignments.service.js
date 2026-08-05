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
exports.AssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const client_1 = require("@prisma/client");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'startDate',
    'endDate',
    'type',
];
let AssignmentsService = class AssignmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
        });
        if (!employee)
            throw new common_1.BadRequestException(`Employee with ID ${dto.employeeId} not found`);
        if (employee.companyId !== companyId)
            throw new common_1.BadRequestException(`Employee with ID ${dto.employeeId} does not belong to this company`);
        const entityExists = await this.validateEntity(dto.type, dto.entityId, companyId);
        if (!entityExists)
            throw new common_1.BadRequestException(`${dto.type} with ID ${dto.entityId} not found`);
        return this.prisma.employeeAssignment.create({
            data: {
                employeeId: dto.employeeId,
                companyId,
                type: dto.type,
                entityId: dto.entityId,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                notes: dto.notes,
            },
            include: { employees: { include: { users: true, departments: true } } },
        });
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, employeeId, type, entityId, startDateFrom, endDateTo, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (employeeId)
            where.employeeId = employeeId;
        if (type)
            where.type = type;
        if (entityId)
            where.entityId = entityId;
        if (startDateFrom || endDateTo) {
            where.startDate = {};
            if (startDateFrom)
                where.startDate.gte = new Date(startDateFrom);
            if (endDateTo)
                where.startDate.lte = new Date(endDateTo);
        }
        if (search) {
            where.OR = [
                { notes: { contains: search, mode: 'insensitive' } },
                {
                    employees: {
                        employeeCode: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    employees: {
                        users: { firstName: { contains: search, mode: 'insensitive' } },
                    },
                },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.employeeAssignment.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: { employees: { include: { users: true, departments: true } } },
            }),
            this.prisma.employeeAssignment.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const assignment = await this.prisma.employeeAssignment.findFirst({
            where: { id, companyId },
            include: { employees: { include: { users: true, departments: true } } },
        });
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found`);
        return assignment;
    }
    async update(id, dto, companyId) {
        const existing = await this.findOne(id, companyId);
        if (dto.type && dto.entityId) {
            const entityExists = await this.validateEntity(dto.type, dto.entityId, companyId);
            if (!entityExists)
                throw new common_1.BadRequestException(`${dto.type} with ID ${dto.entityId} not found`);
        }
        else if (dto.type) {
            const entityExists = await this.validateEntity(dto.type, existing.entityId, companyId);
            if (!entityExists)
                throw new common_1.BadRequestException(`${dto.type} with ID ${existing.entityId} not found`);
        }
        else if (dto.entityId) {
            const entityExists = await this.validateEntity(existing.type, dto.entityId, companyId);
            if (!entityExists)
                throw new common_1.BadRequestException(`${existing.type} with ID ${dto.entityId} not found`);
        }
        const data = { ...dto };
        if (dto.startDate !== undefined)
            data.startDate = dto.startDate ? new Date(dto.startDate) : null;
        if (dto.endDate !== undefined)
            data.endDate = dto.endDate ? new Date(dto.endDate) : null;
        return this.prisma.employeeAssignment.update({
            where: { id },
            data,
            include: { employees: { include: { users: true } } },
        });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.employeeAssignment.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async getAssignmentsByEmployee(employeeId, companyId) {
        return this.prisma.employeeAssignment.findMany({
            where: { employeeId, companyId },
            include: { employees: { include: { users: true } } },
        });
    }
    async validateEntity(type, entityId, companyId) {
        switch (type) {
            case client_1.AssignmentType.PROPERTY:
                return !!(await this.prisma.property.findFirst({
                    where: { id: entityId, companyId },
                }));
            case client_1.AssignmentType.LEAD:
                return !!(await this.prisma.lead.findFirst({
                    where: { id: entityId, companyId },
                }));
            case client_1.AssignmentType.SITE_VISIT:
                return !!(await this.prisma.siteVisit.findFirst({
                    where: { id: entityId, companyId },
                }));
            case client_1.AssignmentType.BOOKING:
                return !!(await this.prisma.booking.findFirst({
                    where: { id: entityId, companyId },
                }));
            default:
                return false;
        }
    }
};
exports.AssignmentsService = AssignmentsService;
exports.AssignmentsService = AssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssignmentsService);
//# sourceMappingURL=assignments.service.js.map
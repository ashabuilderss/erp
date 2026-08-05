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
exports.LeaveAllocationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'year',
    'totalDays',
    'usedDays',
    'leaveType',
];
let LeaveAllocationsService = class LeaveAllocationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        return this.prisma.leaveAllocation.create({
            data: { ...dto, companyId },
            include: { employees: { include: { users: true } } },
        });
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', leaveType, year, employeeId, } = query;
        const where = { companyId };
        if (leaveType)
            where.leaveType = leaveType;
        if (year)
            where.year = year;
        if (employeeId)
            where.employeeId = employeeId;
        if (search) {
            where.OR = [
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
                {
                    employees: {
                        users: { lastName: { contains: search, mode: 'insensitive' } },
                    },
                },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.leaveAllocation.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    employees: { include: { users: true, departments: true } },
                },
            }),
            this.prisma.leaveAllocation.count({ where }),
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
    async findEmployeeBalance(employeeId, companyId, year) {
        const targetYear = year || new Date().getFullYear();
        const allocations = await this.prisma.leaveAllocation.findMany({
            where: { employeeId, companyId, year: targetYear },
        });
        return allocations.map((a) => ({
            leaveType: a.leaveType,
            totalDays: a.totalDays,
            usedDays: a.usedDays,
            remainingDays: a.totalDays - a.usedDays,
        }));
    }
    async findOne(id, companyId) {
        const record = await this.prisma.leaveAllocation.findFirst({
            where: { id, companyId },
            include: { employees: { include: { users: true, departments: true } } },
        });
        if (!record)
            throw new common_1.NotFoundException('Leave allocation not found');
        return record;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.leaveAllocation.update({
            where: { id },
            data: dto,
            include: { employees: { include: { users: true } } },
        });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.leaveAllocation.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.LeaveAllocationsService = LeaveAllocationsService;
exports.LeaveAllocationsService = LeaveAllocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveAllocationsService);
//# sourceMappingURL=leave-allocations.service.js.map
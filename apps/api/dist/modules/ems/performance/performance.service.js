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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const sort_by_1 = require("../../../common/utils/sort-by");
const ALLOWED_SORT = [
    'createdAt',
    'updatedAt',
    'year',
    'quarter',
    'score',
];
let PerformanceService = class PerformanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            select: { companyId: true },
        });
        if (!employee)
            throw new common_1.BadRequestException(`Employee with ID ${dto.employeeId} not found`);
        if (employee.companyId !== companyId)
            throw new common_1.BadRequestException(`Employee with ID ${dto.employeeId} does not belong to this company`);
        const existing = await this.prisma.performance.findUnique({
            where: {
                companyId_employeeId_year_quarter: {
                    companyId: employee.companyId,
                    employeeId: dto.employeeId,
                    year: dto.year,
                    quarter: dto.quarter,
                },
            },
        });
        if (existing)
            throw new common_1.BadRequestException(`Performance for employee ${dto.employeeId} in Q${dto.quarter} ${dto.year} already exists`);
        return this.prisma.performance.create({
            data: { ...dto, companyId },
            include: { employees: { include: { users: true, departments: true } } },
        });
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 10, employeeId, year, quarter, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = { companyId };
        if (employeeId)
            where.employeeId = employeeId;
        if (year)
            where.year = year;
        if (quarter)
            where.quarter = quarter;
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
            this.prisma.performance.findMany({
                where,
                orderBy: { [(0, sort_by_1.safeSortBy)(sortBy, ALLOWED_SORT, 'createdAt')]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: { employees: { include: { users: true, departments: true } } },
            }),
            this.prisma.performance.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const performance = await this.prisma.performance.findFirst({
            where: { id, companyId },
            include: { employees: { include: { users: true, departments: true } } },
        });
        if (!performance)
            throw new common_1.NotFoundException(`Performance with ID ${id} not found`);
        return performance;
    }
    async update(id, dto, companyId) {
        const existing = await this.findOne(id, companyId);
        if (dto.employeeId || dto.year || dto.quarter) {
            const employeeId = dto.employeeId ?? existing.employeeId;
            const year = dto.year ?? existing.year;
            const quarter = dto.quarter ?? existing.quarter;
            const duplicate = await this.prisma.performance.findFirst({
                where: { employeeId, year, quarter, NOT: { id } },
            });
            if (duplicate)
                throw new common_1.BadRequestException(`Performance for employee ${employeeId} in Q${quarter} ${year} already exists`);
        }
        return this.prisma.performance.update({
            where: { id },
            data: dto,
            include: { employees: { include: { users: true } } },
        });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.performance.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async getEmployeePerformance(employeeId, companyId, year) {
        const where = { employeeId, companyId };
        if (year)
            where.year = year;
        return this.prisma.performance.findMany({
            where,
            orderBy: [{ year: 'asc' }, { quarter: 'asc' }],
            include: { employees: { include: { users: true } } },
        });
    }
    async getAverageScore(companyId, year, quarter) {
        const where = { companyId };
        if (year)
            where.year = year;
        if (quarter)
            where.quarter = quarter;
        const result = await this.prisma.performance.aggregate({
            where,
            _avg: { score: true },
        });
        return { averageScore: result._avg.score ?? 0 };
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map
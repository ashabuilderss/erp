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
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let CommissionService = class CommissionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found in this company');
        }
        return this.prisma.pipelineCommission.create({
            data: { ...dto, companyId },
        });
    }
    async findAll(query, companyId) {
        const { page = 1, limit = 20, status, employeeId } = query;
        const where = { companyId };
        if (status)
            where.status = status;
        if (employeeId)
            where.employeeId = employeeId;
        const data = await this.prisma.pipelineCommission.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        const total = await this.prisma.pipelineCommission.count({ where });
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const item = await this.prisma.pipelineCommission.findFirst({
            where: { id, companyId },
        });
        if (!item)
            throw new common_1.NotFoundException('Commission not found');
        return item;
    }
    async updateStatus(id, status, companyId) {
        await this.findOne(id, companyId);
        const data = { status };
        if (status === 'PAID')
            data.paidAt = new Date();
        return this.prisma.pipelineCommission.update({ where: { id }, data });
    }
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommissionService);
//# sourceMappingURL=commission.service.js.map
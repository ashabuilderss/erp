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
exports.IncentivesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let IncentivesService = class IncentivesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        const { payoutStatus, ...rest } = dto;
        return this.prisma.incentive.create({
            data: { ...rest, companyId, payoutStatus: payoutStatus ?? 'PENDING' },
        });
    }
    async findAll(companyId, query) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, payoutStatus, } = query ?? {};
        const where = { companyId };
        if (status)
            where.status = status;
        if (payoutStatus)
            where.payoutStatus = payoutStatus;
        const [data, total] = await Promise.all([
            this.prisma.incentive.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.incentive.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findActive(companyId, query) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = query ?? {};
        const where = { companyId, status: 'ACTIVE' };
        const [data, total] = await Promise.all([
            this.prisma.incentive.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.incentive.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, companyId) {
        const item = await this.prisma.incentive.findFirst({
            where: { id, companyId },
        });
        if (!item)
            throw new common_1.NotFoundException('Incentive not found');
        return item;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.incentive.update({ where: { id }, data: dto });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        return this.prisma.incentive.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async leaderboard(companyId, employeeId) {
        const ownWhere = employeeId ? { assignedToEmployeeId: employeeId } : {};
        const incentivesWon = await this.prisma.incentive.groupBy({
            by: ['winnerId'],
            where: { companyId, winnerId: { not: null }, status: 'CLOSED' },
            _count: { id: true },
            _sum: { value: true },
        });
        const commissions = await this.prisma.pipelineCommission.groupBy({
            by: ['employeeId'],
            where: { companyId, status: 'PAID' },
            _count: { id: true },
            _sum: { amount: true },
        });
        const [leadGroup, bookingGroup] = await Promise.all([
            this.prisma.lead.groupBy({
                by: ['assignedToEmployeeId'],
                where: { companyId, ...ownWhere },
                _count: { id: true },
            }),
            this.prisma.booking.groupBy({
                by: ['assignedToEmployeeId'],
                where: { companyId, ...ownWhere },
                _count: { id: true },
            }),
        ]);
        const leadCounts = leadGroup.filter((l) => !!l.assignedToEmployeeId);
        const bookingCounts = bookingGroup.filter((b) => !!b.assignedToEmployeeId);
        const winnerIds = [
            ...new Set([
                ...incentivesWon.map((i) => i.winnerId).filter(Boolean),
                ...commissions.map((c) => c.employeeId),
                ...leadCounts.map((l) => l.assignedToEmployeeId),
                ...bookingCounts.map((b) => b.assignedToEmployeeId),
            ]),
        ];
        if (winnerIds.length === 0)
            return [];
        const employees = await this.prisma.employee.findMany({
            where: { id: { in: winnerIds }, companyId },
            select: {
                id: true,
                employeeCode: true,
                users: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        const empMap = new Map(employees.map((e) => [e.id, e]));
        const rows = winnerIds.map((id) => {
            const inc = incentivesWon.find((i) => i.winnerId === id);
            const com = commissions.find((c) => c.employeeId === id);
            const leads = leadCounts.find((l) => l.assignedToEmployeeId === id);
            const booking = bookingCounts.find((b) => b.assignedToEmployeeId === id);
            const incentivesScore = (inc?._count?.id ?? 0) * 10;
            const commissionTotal = Number(com?._sum?.amount ?? 0);
            const totalScore = incentivesScore + commissionTotal;
            const emp = empMap.get(id);
            return {
                employeeId: id,
                employeeName: emp?.users
                    ? `${emp.users.firstName} ${emp.users.lastName}`
                    : 'Unknown',
                employeeCode: emp?.employeeCode ?? '',
                incentivesWon: inc?._count?.id ?? 0,
                incentivesValue: Number(inc?._sum?.value ?? 0),
                commissionsPaid: com?._count?.id ?? 0,
                commissionTotal,
                leadsAssigned: leads?._count?.id ?? 0,
                bookingsHandled: booking?._count?.id ?? 0,
                totalScore,
            };
        });
        rows.sort((a, b) => b.totalScore - a.totalScore);
        return rows;
    }
};
exports.IncentivesService = IncentivesService;
exports.IncentivesService = IncentivesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncentivesService);
//# sourceMappingURL=incentives.service.js.map
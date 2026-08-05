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
exports.ProjectProfitabilityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ProjectProfitabilityService = class ProjectProfitabilityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            ...(query.status && { status: query.status }),
            ...(query.search && {
                site: {
                    name: { contains: query.search, mode: 'insensitive' },
                },
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.projectBudget.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    site: {
                        select: { id: true, name: true, status: true },
                    },
                    _count: { select: { costEntries: true } },
                },
            }),
            this.prisma.projectBudget.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, companyId) {
        const budget = await this.prisma.projectBudget.findFirst({
            where: { id, companyId },
            include: {
                site: {
                    select: { id: true, name: true, status: true },
                },
                costEntries: {
                    orderBy: { date: 'desc' },
                },
            },
        });
        if (!budget)
            throw new common_1.NotFoundException('Project budget not found');
        return budget;
    }
    async create(dto, companyId) {
        const existing = await this.prisma.projectBudget.findUnique({
            where: { siteId: dto.siteId },
        });
        if (existing) {
            throw new common_1.BadRequestException('A budget already exists for this construction site');
        }
        return this.prisma.projectBudget.create({
            data: {
                siteId: dto.siteId,
                companyId,
                budgetAmount: dto.budgetAmount,
                status: 'ACTIVE',
            },
            include: {
                site: {
                    select: { id: true, name: true, status: true },
                },
            },
        });
    }
    async update(id, dto, companyId) {
        const existing = await this.prisma.projectBudget.findFirst({
            where: { id, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Project budget not found');
        return this.prisma.projectBudget.update({
            where: { id },
            data: {
                ...(dto.budgetAmount !== undefined && { budgetAmount: dto.budgetAmount }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
    }
    async listCostEntries(id, companyId) {
        const budget = await this.prisma.projectBudget.findFirst({
            where: { id, companyId },
        });
        if (!budget)
            throw new common_1.NotFoundException('Project budget not found');
        return this.prisma.projectCostEntry.findMany({
            where: { budgetId: id },
            orderBy: { date: 'desc' },
        });
    }
    async addCostEntry(budgetId, dto, companyId) {
        const budget = await this.prisma.projectBudget.findFirst({
            where: { id: budgetId, companyId },
        });
        if (!budget)
            throw new common_1.NotFoundException('Project budget not found');
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.projectCostEntry.create({
                data: {
                    budgetId,
                    category: dto.category,
                    amount: dto.amount,
                    description: dto.description,
                    date: dto.date ? new Date(dto.date) : new Date(),
                    companyId,
                },
            });
            const aggregate = await tx.projectCostEntry.aggregate({
                where: { budgetId },
                _sum: { amount: true },
            });
            const totalActual = Number(aggregate._sum.amount ?? 0);
            await tx.projectBudget.update({
                where: { id: budgetId },
                data: { actualAmount: totalActual },
            });
            return entry;
        });
    }
    async deleteCostEntry(entryId, companyId) {
        const entry = await this.prisma.projectCostEntry.findFirst({
            where: { id: entryId },
            include: { budget: true },
        });
        if (!entry)
            throw new common_1.NotFoundException('Cost entry not found');
        if (entry.budget.companyId !== companyId) {
            throw new common_1.NotFoundException('Cost entry not found');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.projectCostEntry.delete({ where: { id: entryId } });
            const aggregate = await tx.projectCostEntry.aggregate({
                where: { budgetId: entry.budgetId },
                _sum: { amount: true },
            });
            const totalActual = Number(aggregate._sum.amount ?? 0);
            await tx.projectBudget.update({
                where: { id: entry.budgetId },
                data: { actualAmount: totalActual },
            });
            return { deleted: true };
        });
    }
    async getSummary(companyId) {
        const budgets = await this.prisma.projectBudget.findMany({
            where: { companyId },
            include: {
                site: { select: { id: true, name: true } },
            },
        });
        const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budgetAmount), 0);
        const totalActual = budgets.reduce((sum, b) => sum + Number(b.actualAmount), 0);
        const totalVariance = totalBudget - totalActual;
        const profitMarginPct = totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(2) : '0.00';
        return {
            totalBudget,
            totalActual,
            totalVariance,
            profitMarginPercent: parseFloat(profitMarginPct),
            projects: budgets.map((b) => ({
                siteId: b.siteId,
                siteName: b.site.name,
                budgetAmount: Number(b.budgetAmount),
                actualAmount: Number(b.actualAmount),
                variance: Number(b.budgetAmount) - Number(b.actualAmount),
                status: b.status,
            })),
        };
    }
};
exports.ProjectProfitabilityService = ProjectProfitabilityService;
exports.ProjectProfitabilityService = ProjectProfitabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectProfitabilityService);
//# sourceMappingURL=project-profitability.service.js.map
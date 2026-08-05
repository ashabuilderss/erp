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
exports.ChartOfAccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
let ChartOfAccountsService = class ChartOfAccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, companyId) {
        const existing = await this.prisma.chartOfAccount.findUnique({
            where: { companyId_code: { companyId, code: dto.code } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Account code ${dto.code} already exists`);
        }
        return this.prisma.chartOfAccount.create({
            data: { ...dto, companyId },
        });
    }
    async findAll(dto, companyId) {
        const page = parseInt(dto.page || '1', 10);
        const limit = parseInt(dto.limit || '50', 10);
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (dto.type)
            where.type = dto.type;
        if (dto.search) {
            where.OR = [
                { name: { contains: dto.search, mode: 'insensitive' } },
                { code: { contains: dto.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.chartOfAccount.findMany({
                where,
                skip,
                take: limit,
                orderBy: { code: 'asc' },
                include: { parent: { select: { id: true, code: true, name: true } } },
            }),
            this.prisma.chartOfAccount.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async findOne(id, companyId) {
        const account = await this.prisma.chartOfAccount.findFirst({
            where: { id, companyId },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                children: { select: { id: true, code: true, name: true, type: true } },
            },
        });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        return account;
    }
    async update(id, dto, companyId) {
        await this.findOne(id, companyId);
        const payload = dto;
        if (payload.code) {
            const existing = await this.prisma.chartOfAccount.findUnique({
                where: { companyId_code: { companyId, code: payload.code } },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Account code ${payload.code} already exists`);
            }
        }
        return this.prisma.chartOfAccount.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id, companyId) {
        await this.findOne(id, companyId);
        const childrenCount = await this.prisma.chartOfAccount.count({
            where: { parentId: id },
        });
        if (childrenCount > 0) {
            throw new common_1.ConflictException('Cannot delete account with child accounts');
        }
        await this.prisma.chartOfAccount.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.ChartOfAccountsService = ChartOfAccountsService;
exports.ChartOfAccountsService = ChartOfAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChartOfAccountsService);
//# sourceMappingURL=chart-of-accounts.service.js.map
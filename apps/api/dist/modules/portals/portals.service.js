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
exports.PortalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let PortalsService = class PortalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createComplaint(dto, companyId) {
        return this.prisma.complaint.create({
            data: { ...dto, companyId },
            include: { customers: true, properties: true },
        });
    }
    async findAllComplaints(query, companyId) {
        const { page = 1, limit = 10, status, customerId, search } = query;
        const where = { companyId };
        if (status)
            where.status = status;
        if (customerId)
            where.customerId = customerId;
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { customers: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.complaint.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { customers: true, properties: true },
            }),
            this.prisma.complaint.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOneComplaint(id, companyId) {
        const complaint = await this.prisma.complaint.findFirst({
            where: { id, companyId },
            include: { customers: true, properties: true },
        });
        if (!complaint) {
            throw new common_1.NotFoundException(`Complaint with ID ${id} not found`);
        }
        return complaint;
    }
    async updateComplaint(id, dto, companyId) {
        await this.findOneComplaint(id, companyId);
        const data = { ...dto };
        if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
            data.resolvedAt = new Date();
        }
        return this.prisma.complaint.update({
            where: { id },
            data,
            include: { customers: true, properties: true },
        });
    }
    async deleteComplaint(id, companyId) {
        await this.findOneComplaint(id, companyId);
        return this.prisma.complaint.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async resolveComplaint(id, resolution, companyId) {
        await this.findOneComplaint(id, companyId);
        return this.prisma.complaint.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolution,
                resolvedAt: new Date(),
            },
            include: { customers: true, properties: true },
        });
    }
};
exports.PortalsService = PortalsService;
exports.PortalsService = PortalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PortalsService);
//# sourceMappingURL=portals.service.js.map
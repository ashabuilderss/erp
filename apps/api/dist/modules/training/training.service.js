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
exports.TrainingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let TrainingService = class TrainingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllSops(companyId, query) {
        const { departmentId, search, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            ...(departmentId && { departmentId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.sopDocument.findMany({
                where,
                include: {
                    department: { select: { id: true, name: true } },
                    _count: { select: { acknowledgements: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.sopDocument.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async createSop(companyId, dto) {
        if (dto.departmentId) {
            const dept = await this.prisma.department.findFirst({
                where: { id: dto.departmentId, companyId },
            });
            if (!dept)
                throw new common_1.NotFoundException('Department not found');
        }
        return this.prisma.sopDocument.create({
            data: {
                companyId,
                title: dto.title,
                content: dto.content,
                fileUrl: dto.fileUrl,
                departmentId: dto.departmentId,
            },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }
    async findOneSop(companyId, id) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id, companyId },
            include: {
                department: { select: { id: true, name: true } },
                acknowledgements: {
                    include: {
                        employee: {
                            include: {
                                users: {
                                    select: { firstName: true, lastName: true, email: true },
                                },
                            },
                        },
                    },
                    orderBy: { acknowledgedAt: 'desc' },
                },
                _count: { select: { acknowledgements: true } },
            },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        return sop;
    }
    async updateSop(companyId, id, dto) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id, companyId },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        return this.prisma.sopDocument.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
                ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
            include: {
                department: { select: { id: true, name: true } },
            },
        });
    }
    async removeSop(companyId, id) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id, companyId },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        return this.prisma.sopDocument.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async acknowledgeSop(companyId, sopId, employeeId) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id: sopId, companyId },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        if (!sop.isActive)
            throw new common_1.BadRequestException('SOP document is not active');
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, companyId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        const existing = await this.prisma.sopAcknowledgement.findFirst({
            where: { sopDocumentId: sopId, employeeId },
        });
        if (existing) {
            throw new common_1.ConflictException('Employee has already acknowledged this SOP');
        }
        return this.prisma.sopAcknowledgement.create({
            data: { sopDocumentId: sopId, employeeId, companyId },
            include: {
                employee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
    }
    async listAcknowledgements(companyId, sopId) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id: sopId, companyId },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        return this.prisma.sopAcknowledgement.findMany({
            where: { sopDocumentId: sopId },
            include: {
                employee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
            orderBy: { acknowledgedAt: 'desc' },
        });
    }
    async findAllRecords(companyId, query) {
        const { employeeId, sopDocumentId, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            ...(employeeId && { employeeId }),
            ...(sopDocumentId && { sopDocumentId }),
        };
        const [items, total] = await Promise.all([
            this.prisma.trainingRecord.findMany({
                where,
                include: {
                    sopDocument: {
                        select: { id: true, title: true, version: true },
                    },
                    employee: {
                        include: {
                            users: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                },
                orderBy: { completedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.trainingRecord.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async createRecord(companyId, dto) {
        const sop = await this.prisma.sopDocument.findFirst({
            where: { id: dto.sopDocumentId, companyId },
        });
        if (!sop)
            throw new common_1.NotFoundException('SOP document not found');
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return this.prisma.trainingRecord.create({
            data: {
                employeeId: dto.employeeId,
                sopDocumentId: dto.sopDocumentId,
                completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
                score: dto.score,
                companyId,
            },
            include: {
                sopDocument: {
                    select: { id: true, title: true, version: true },
                },
                employee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
    }
};
exports.TrainingService = TrainingService;
exports.TrainingService = TrainingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrainingService);
//# sourceMappingURL=training.service.js.map
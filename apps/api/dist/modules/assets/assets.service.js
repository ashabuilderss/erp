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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
let AssetsService = class AssetsService {
    prisma;
    transitionService;
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async findAll(companyId, query) {
        const { status, category, search, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            deletedAt: null,
            ...(status && { status: status }),
            ...(category ? { category } : {}),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { serialNumber: { contains: search, mode: 'insensitive' } },
                    { qrCode: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [items, total] = await Promise.all([
            this.prisma.asset.findMany({
                where,
                include: {
                    currentAssignee: {
                        include: {
                            users: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                    _count: { select: { assignments: true, repairs: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.asset.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(companyId, dto) {
        return this.prisma.asset.create({
            data: {
                companyId,
                name: dto.name,
                category: dto.category ?? 'UNCATEGORIZED',
                serialNumber: dto.serialNumber ?? null,
                qrCode: dto.qrCode ?? null,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                purchaseCost: dto.purchaseCost,
            },
            include: {
                currentAssignee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
    }
    async findOne(companyId, id) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                currentAssignee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
                assignments: {
                    include: {
                        employee: {
                            include: {
                                users: {
                                    select: { firstName: true, lastName: true, email: true },
                                },
                            },
                        },
                    },
                    orderBy: { assignedAt: 'desc' },
                },
                repairs: {
                    orderBy: { startDate: 'desc' },
                },
            },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return asset;
    }
    async update(companyId, id, dto) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return this.prisma.asset.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
                ...(dto.qrCode !== undefined && { qrCode: dto.qrCode }),
                ...(dto.purchaseDate !== undefined && {
                    purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                }),
                ...(dto.purchaseCost !== undefined && { purchaseCost: dto.purchaseCost }),
            },
            include: {
                currentAssignee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
    }
    async remove(companyId, id) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return this.prisma.asset.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'RETIRED' },
        });
    }
    async assign(companyId, id, dto) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        this.transitionService.validate('Asset', asset.status, 'ASSIGNED');
        const employee = await this.prisma.employee.findFirst({
            where: { id: dto.employeeId, companyId },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assetAssignment.create({
                data: {
                    assetId: id,
                    employeeId: dto.employeeId,
                    condition: dto.condition,
                    companyId,
                },
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
            await tx.asset.update({
                where: { id },
                data: { status: 'ASSIGNED', currentAssigneeId: dto.employeeId },
            });
            return assignment;
        });
    }
    async returnAsset(companyId, id) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        this.transitionService.validate('Asset', asset.status, 'AVAILABLE');
        return this.prisma.$transaction(async (tx) => {
            const openAssignment = await tx.assetAssignment.findFirst({
                where: { assetId: id, returnedAt: null },
                orderBy: { assignedAt: 'desc' },
            });
            if (openAssignment) {
                await tx.assetAssignment.update({
                    where: { id: openAssignment.id },
                    data: { returnedAt: new Date() },
                });
            }
            await tx.asset.update({
                where: { id },
                data: { status: 'AVAILABLE', currentAssigneeId: null },
            });
            return this.prisma.asset.findFirst({
                where: { id },
                include: {
                    currentAssignee: {
                        include: {
                            users: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                },
            });
        });
    }
    async listAssignments(companyId, id) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return this.prisma.assetAssignment.findMany({
            where: { assetId: id },
            include: {
                employee: {
                    include: {
                        users: {
                            select: { firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }
    async createRepair(companyId, id, dto) {
        const asset = await this.prisma.asset.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        this.transitionService.validate('Asset', asset.status, 'IN_REPAIR');
        return this.prisma.$transaction(async (tx) => {
            const repair = await tx.assetRepair.create({
                data: {
                    assetId: id,
                    description: dto.description,
                    cost: dto.cost,
                    status: 'PENDING',
                    startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                    companyId,
                },
            });
            await tx.asset.update({
                where: { id },
                data: { status: 'IN_REPAIR' },
            });
            return repair;
        });
    }
    async updateRepair(companyId, repairId, dto) {
        const repair = await this.prisma.assetRepair.findFirst({
            where: { id: repairId },
            include: { asset: true },
        });
        if (!repair || repair.asset.companyId !== companyId) {
            throw new common_1.NotFoundException('Repair record not found');
        }
        const updated = await this.prisma.assetRepair.update({
            where: { id: repairId },
            data: {
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.cost !== undefined && { cost: dto.cost }),
                ...(dto.endDate !== undefined && {
                    endDate: dto.endDate ? new Date(dto.endDate) : null,
                }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
        if (dto.status === 'COMPLETED') {
            this.transitionService.validate('Asset', repair.asset.status, 'AVAILABLE');
            await this.prisma.asset.update({
                where: { id: repair.assetId },
                data: { status: 'AVAILABLE' },
            });
        }
        return updated;
    }
    async getSummary(companyId) {
        const counts = await this.prisma.asset.groupBy({
            by: ['status'],
            where: { companyId, deletedAt: null },
            _count: { id: true },
        });
        const summary = {
            AVAILABLE: 0,
            ASSIGNED: 0,
            IN_REPAIR: 0,
            RETIRED: 0,
        };
        for (const item of counts) {
            summary[item.status] = item._count.id;
        }
        const total = Object.values(summary).reduce((sum, v) => sum + v, 0);
        return { summary, total };
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map
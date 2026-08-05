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
exports.ConstructionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let ConstructionService = class ConstructionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSite(dto, companyId) {
        return this.prisma.constructionSite.create({
            data: {
                ...dto,
                companyId,
                budget: dto.budget ?? undefined,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }
    async findAllSites(query, companyId) {
        const where = { companyId };
        if (query.status)
            where.status = query.status;
        if (query.search)
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { location: { contains: query.search, mode: 'insensitive' } },
            ];
        const total = await this.prisma.constructionSite.count({ where });
        const data = await this.prisma.constructionSite.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        sitePhases: true,
                        labourEntries: true,
                        progressPhotos: true,
                    },
                },
            },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async findOneSite(id, companyId) {
        const site = await this.prisma.constructionSite.findFirst({
            where: { id, companyId },
            include: {
                sitePhases: { orderBy: { sortOrder: 'asc' } },
                progressPhotos: { orderBy: { takenAt: 'desc' }, take: 10 },
            },
        });
        if (!site)
            throw new common_1.NotFoundException('Site not found');
        return site;
    }
    async updateSite(id, dto, companyId) {
        await this.findOneSite(id, companyId);
        return this.prisma.constructionSite.update({
            where: { id },
            data: {
                ...dto,
                budget: dto.budget ?? undefined,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }
    async deleteSite(id, companyId) {
        await this.findOneSite(id, companyId);
        return this.prisma.constructionSite.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createPhase(siteId, dto, companyId) {
        await this.findOneSite(siteId, companyId);
        return this.prisma.sitePhase.create({
            data: {
                ...dto,
                siteId,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }
    async updatePhase(id, dto, companyId) {
        const phase = await this.prisma.sitePhase.findFirst({
            where: { id, constructionSites: { companyId } },
        });
        if (!phase)
            throw new common_1.NotFoundException('Phase not found');
        return this.prisma.sitePhase.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }
    async deletePhase(id, companyId) {
        const phase = await this.prisma.sitePhase.findFirst({
            where: { id, constructionSites: { companyId } },
        });
        if (!phase)
            throw new common_1.NotFoundException('Phase not found');
        return this.prisma.sitePhase.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createVendor(dto, companyId) {
        const { name, contactPerson, phone, email, address, gstin, status } = dto;
        return this.prisma.vendor.create({
            data: { name, contactPerson, phone, email, address, gstin, status, companyId },
        });
    }
    async findAllVendors(query, companyId) {
        const where = { companyId };
        if (query.search)
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { contactPerson: { contains: query.search, mode: 'insensitive' } },
            ];
        const total = await this.prisma.vendor.count({ where });
        const data = await this.prisma.vendor.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { name: 'asc' },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async findOneVendor(id, companyId) {
        const vendor = await this.prisma.vendor.findFirst({
            where: { id, companyId },
        });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        return vendor;
    }
    async updateVendor(id, dto, companyId) {
        await this.findOneVendor(id, companyId);
        return this.prisma.vendor.update({ where: { id }, data: dto });
    }
    async deleteVendor(id, companyId) {
        await this.findOneVendor(id, companyId);
        return this.prisma.vendor.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createMaterial(dto, companyId) {
        const { name, category, unit, unitPrice } = dto;
        await this.prisma.material.deleteMany({
            where: { companyId, name, deletedAt: { not: null } },
        });
        return this.prisma.material.create({
            data: { name, category, unit, unitPrice, companyId },
        });
    }
    async findAllMaterials(query, companyId) {
        const where = { companyId, deletedAt: null };
        if (query.category)
            where.category = query.category;
        if (query.search)
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { category: { contains: query.search, mode: 'insensitive' } },
            ];
        const total = await this.prisma.material.count({ where });
        const data = await this.prisma.material.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { name: 'asc' },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async updateMaterial(id, dto, companyId) {
        const mat = await this.prisma.material.findFirst({
            where: { id, companyId },
        });
        if (!mat)
            throw new common_1.NotFoundException('Material not found');
        return this.prisma.material.update({
            where: { id },
            data: { ...dto, unitPrice: dto.unitPrice ?? undefined },
        });
    }
    async deleteMaterial(id, companyId) {
        const mat = await this.prisma.material.findFirst({
            where: { id, companyId },
        });
        if (!mat)
            throw new common_1.NotFoundException('Material not found');
        return this.prisma.material.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createMaterialInward(dto, companyId) {
        const totalAmount = Math.round(dto.quantity * dto.unitPrice * 100) / 100;
        const result = await this.prisma.materialInward.create({
            data: {
                ...dto,
                companyId,
                totalAmount,
                receivedDate: new Date(dto.receivedDate),
            },
        });
        await this.prisma.inventoryItem.upsert({
            where: {
                companyId_siteId_materialId: {
                    companyId,
                    siteId: dto.siteId,
                    materialId: dto.materialId,
                },
            },
            update: { quantityOnHand: { increment: dto.quantity } },
            create: {
                companyId,
                siteId: dto.siteId,
                materialId: dto.materialId,
                quantityOnHand: dto.quantity,
            },
        });
        return result;
    }
    async findAllMaterialInward(query, companyId) {
        const where = { companyId };
        if (query.siteId)
            where.siteId = query.siteId;
        if (query.vendorId)
            where.vendorId = query.vendorId;
        const total = await this.prisma.materialInward.count({ where });
        const data = await this.prisma.materialInward.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { receivedDate: 'desc' },
            include: {
                vendors: { select: { name: true } },
                constructionSites: { select: { name: true } },
                materials: { select: { name: true, unit: true } },
            },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async updateMaterialInward(id, dto, companyId) {
        const entry = await this.prisma.materialInward.findFirst({
            where: { id, companyId },
        });
        if (!entry)
            throw new common_1.NotFoundException('Material inward entry not found');
        const updateData = { ...dto };
        if (dto.receivedDate)
            updateData.receivedDate = new Date(dto.receivedDate);
        if (dto.quantity && dto.unitPrice) {
            updateData.totalAmount =
                Math.round(dto.quantity * dto.unitPrice * 100) / 100;
        }
        const result = await this.prisma.materialInward.update({
            where: { id },
            data: updateData,
        });
        const prevQty = Number(entry.quantity);
        const quantityDiff = dto.quantity ? dto.quantity - prevQty : 0;
        if (quantityDiff !== 0) {
            await this.prisma.inventoryItem.upsert({
                where: {
                    companyId_siteId_materialId: {
                        companyId,
                        siteId: entry.siteId,
                        materialId: entry.materialId,
                    },
                },
                update: { quantityOnHand: { increment: quantityDiff } },
                create: {
                    companyId,
                    siteId: entry.siteId,
                    materialId: entry.materialId,
                    quantityOnHand: quantityDiff,
                },
            });
        }
        return result;
    }
    async deleteMaterialInward(id, companyId) {
        const entry = await this.prisma.materialInward.findFirst({
            where: { id, companyId },
        });
        if (!entry)
            throw new common_1.NotFoundException('Material inward entry not found');
        await this.prisma.materialInward.update({ where: { id }, data: { deletedAt: new Date() } });
        const prevQty = Number(entry.quantity);
        await this.prisma.inventoryItem.upsert({
            where: {
                companyId_siteId_materialId: {
                    companyId,
                    siteId: entry.siteId,
                    materialId: entry.materialId,
                },
            },
            update: { quantityOnHand: { decrement: prevQty } },
            create: {
                companyId,
                siteId: entry.siteId,
                materialId: entry.materialId,
                quantityOnHand: 0,
            },
        });
    }
    async findInventory(query, companyId) {
        const where = { companyId };
        if (query.siteId)
            where.siteId = query.siteId;
        const data = await this.prisma.inventoryItem.findMany({
            where,
            orderBy: { lastUpdated: 'desc' },
            include: {
                constructionSites: { select: { name: true } },
                materials: { select: { name: true, unit: true, category: true } },
            },
        });
        return data;
    }
    async createLabourEntry(dto, companyId) {
        return this.prisma.labourEntry.create({
            data: {
                ...dto,
                companyId,
                date: new Date(dto.date),
                hoursWorked: dto.hoursWorked ?? undefined,
            },
        });
    }
    async findAllLabourEntries(query, companyId) {
        const where = { companyId };
        if (query.siteId)
            where.siteId = query.siteId;
        if (query.date)
            where.date = new Date(query.date);
        const total = await this.prisma.labourEntry.count({ where });
        const data = await this.prisma.labourEntry.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { date: 'desc' },
            include: { constructionSites: { select: { name: true } } },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async deleteLabourEntry(id, companyId) {
        const entry = await this.prisma.labourEntry.findFirst({
            where: { id, companyId },
        });
        if (!entry)
            throw new common_1.NotFoundException('Labour entry not found');
        return this.prisma.labourEntry.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async createConsumption(dto, companyId, userId) {
        const material = await this.prisma.material.findFirst({
            where: { id: dto.materialId, companyId, deletedAt: null },
        });
        if (!material)
            throw new common_1.NotFoundException('Material not found');
        const site = await this.prisma.constructionSite.findFirst({
            where: { id: dto.siteId, companyId, deletedAt: null },
        });
        if (!site)
            throw new common_1.NotFoundException('Construction site not found');
        if (dto.phaseId) {
            const phase = await this.prisma.sitePhase.findFirst({
                where: { id: dto.phaseId, siteId: dto.siteId, deletedAt: null },
            });
            if (!phase)
                throw new common_1.NotFoundException('Phase not found');
        }
        return this.prisma.$transaction(async (tx) => {
            const consumption = await tx.materialConsumption.create({
                data: {
                    companyId,
                    siteId: dto.siteId,
                    phaseId: dto.phaseId ?? null,
                    materialId: dto.materialId,
                    quantity: dto.quantity,
                    consumedDate: new Date(dto.consumedDate),
                    notes: dto.notes ?? null,
                },
            });
            const inventoryItem = await tx.inventoryItem.findFirst({
                where: {
                    companyId,
                    siteId: dto.siteId,
                    materialId: dto.materialId,
                    deletedAt: null,
                },
            });
            if (inventoryItem) {
                const currentQty = Number(inventoryItem.quantityOnHand);
                if (currentQty < dto.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock. Available: ${currentQty}, Required: ${dto.quantity}`);
                }
                await tx.inventoryItem.update({
                    where: { id: inventoryItem.id },
                    data: {
                        quantityOnHand: { decrement: dto.quantity },
                        lastUpdated: new Date(),
                    },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        itemId: inventoryItem.id,
                        companyId,
                        type: 'OUTWARD',
                        quantity: dto.quantity,
                        date: new Date(dto.consumedDate),
                        recordedById: userId,
                    },
                });
            }
            return consumption;
        });
    }
    async findAllConsumptions(query, companyId) {
        const where = { companyId };
        if (query.siteId)
            where.siteId = query.siteId;
        if (query.materialId)
            where.materialId = query.materialId;
        if (query.phaseId)
            where.phaseId = query.phaseId;
        const total = await this.prisma.materialConsumption.count({ where });
        const data = await this.prisma.materialConsumption.findMany({
            where,
            skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
            take: query.limit ?? 10,
            orderBy: { consumedDate: 'desc' },
            include: {
                constructionSites: { select: { name: true } },
                sitePhases: { select: { name: true } },
                materials: { select: { name: true, unit: true } },
            },
        });
        return {
            data,
            meta: {
                total,
                page: query.page ?? 1,
                limit: query.limit ?? 10,
                totalPages: Math.ceil(total / (query.limit ?? 10)),
            },
        };
    }
    async deleteConsumption(id, companyId) {
        const consumption = await this.prisma.materialConsumption.findFirst({
            where: { id, companyId },
        });
        if (!consumption)
            throw new common_1.NotFoundException('Consumption record not found');
        return this.prisma.$transaction(async (tx) => {
            await tx.materialConsumption.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            const inventoryItem = await tx.inventoryItem.findFirst({
                where: {
                    companyId,
                    siteId: consumption.siteId,
                    materialId: consumption.materialId,
                    deletedAt: null,
                },
            });
            if (inventoryItem) {
                await tx.inventoryItem.update({
                    where: { id: inventoryItem.id },
                    data: {
                        quantityOnHand: { increment: consumption.quantity },
                        lastUpdated: new Date(),
                    },
                });
            }
            return consumption;
        });
    }
    async createProgressPhoto(dto, companyId) {
        return this.prisma.progressPhoto.create({
            data: {
                ...dto,
                companyId,
                takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
            },
        });
    }
    async findSitePhotos(siteId, companyId) {
        await this.findOneSite(siteId, companyId);
        return this.prisma.progressPhoto.findMany({
            where: { siteId, companyId },
            orderBy: { takenAt: 'desc' },
            include: { sitePhases: { select: { name: true } } },
        });
    }
    async deleteProgressPhoto(id, companyId) {
        const photo = await this.prisma.progressPhoto.findFirst({
            where: { id, companyId },
        });
        if (!photo)
            throw new common_1.NotFoundException('Photo not found');
        return this.prisma.progressPhoto.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.ConstructionService = ConstructionService;
exports.ConstructionService = ConstructionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConstructionService);
//# sourceMappingURL=construction.service.js.map
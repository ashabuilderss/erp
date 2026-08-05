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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(companyId, dto) {
        const material = await this.prisma.material.findFirst({
            where: { id: dto.materialId, companyId, deletedAt: null },
        });
        if (!material) {
            throw new common_1.NotFoundException('Material not found');
        }
        const site = await this.prisma.constructionSite.findFirst({
            where: { id: dto.siteId, companyId, deletedAt: null },
        });
        if (!site) {
            throw new common_1.NotFoundException('Construction site not found');
        }
        const existing = await this.prisma.inventoryItem.findFirst({
            where: {
                companyId,
                siteId: dto.siteId,
                materialId: dto.materialId,
                deletedAt: null,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('An inventory item for this material already exists at this site');
        }
        return this.prisma.inventoryItem.create({
            data: {
                companyId,
                siteId: dto.siteId,
                materialId: dto.materialId,
                quantityOnHand: dto.quantityOnHand ?? 0,
                lowStockThreshold: dto.lowStockThreshold ?? 10,
            },
            include: {
                materials: true,
                constructionSites: true,
            },
        });
    }
    async findAll(companyId, query) {
        if (query.lowStock === true) {
            const items = await this.prisma.$queryRaw `
        SELECT * FROM inventory_items
        WHERE company_id = ${companyId}
          AND deleted_at IS NULL
          AND CAST(quantity_on_hand AS NUMERIC) <= low_stock_threshold
      `;
            let filtered = items;
            if (query.siteId) {
                filtered = filtered.filter((i) => i.siteId === query.siteId);
            }
            if (query.materialId) {
                filtered = filtered.filter((i) => i.materialId === query.materialId);
            }
            const ids = filtered.map((i) => i.id);
            if (ids.length === 0)
                return [];
            return this.prisma.inventoryItem.findMany({
                where: { id: { in: ids }, deletedAt: null },
                include: {
                    materials: true,
                    constructionSites: true,
                },
                orderBy: { lastUpdated: 'desc' },
            });
        }
        return this.prisma.inventoryItem.findMany({
            where: {
                companyId,
                deletedAt: null,
                ...(query.siteId && { siteId: query.siteId }),
                ...(query.materialId && { materialId: query.materialId }),
            },
            include: {
                materials: true,
                constructionSites: true,
            },
            orderBy: { lastUpdated: 'desc' },
        });
    }
    async findOne(companyId, id) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                materials: true,
                constructionSites: true,
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 20,
                    include: {
                        siteFrom: true,
                        siteTo: true,
                        recordedBy: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return item;
    }
    async update(companyId, id, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const data = {};
        if (dto.lowStockThreshold !== undefined) {
            data.lowStockThreshold = dto.lowStockThreshold;
        }
        if (dto.quantityOnHand !== undefined) {
            data.quantityOnHand = dto.quantityOnHand;
            data.lastUpdated = new Date();
        }
        return this.prisma.inventoryItem.update({
            where: { id },
            data,
            include: {
                materials: true,
                constructionSites: true,
            },
        });
    }
    async recordInward(companyId, itemId, userId, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, companyId, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    itemId,
                    companyId,
                    type: 'INWARD',
                    quantity: dto.quantity,
                    recordedById: userId,
                },
            });
            const updatedItem = await tx.inventoryItem.update({
                where: { id: itemId },
                data: {
                    quantityOnHand: { increment: dto.quantity },
                    lastUpdated: new Date(),
                },
                include: {
                    materials: true,
                    constructionSites: true,
                },
            });
            return { transaction, item: updatedItem };
        });
    }
    async recordOutward(companyId, itemId, userId, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, companyId, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const currentQty = Number(item.quantityOnHand);
        if (currentQty < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock. Available: ${currentQty}, Requested: ${dto.quantity}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    itemId,
                    companyId,
                    type: 'OUTWARD',
                    quantity: dto.quantity,
                    recordedById: userId,
                },
            });
            const updatedItem = await tx.inventoryItem.update({
                where: { id: itemId },
                data: {
                    quantityOnHand: { decrement: dto.quantity },
                    lastUpdated: new Date(),
                },
                include: {
                    materials: true,
                    constructionSites: true,
                },
            });
            return { transaction, item: updatedItem };
        });
    }
    async recordWastage(companyId, itemId, userId, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, companyId, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const currentQty = Number(item.quantityOnHand);
        if (currentQty < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock for wastage. Available: ${currentQty}, Wastage: ${dto.quantity}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    itemId,
                    companyId,
                    type: 'WASTAGE',
                    quantity: dto.quantity,
                    recordedById: userId,
                },
            });
            const updatedItem = await tx.inventoryItem.update({
                where: { id: itemId },
                data: {
                    quantityOnHand: { decrement: dto.quantity },
                    lastUpdated: new Date(),
                },
                include: {
                    materials: true,
                    constructionSites: true,
                },
            });
            return { transaction, item: updatedItem };
        });
    }
    async recordTransfer(companyId, itemId, userId, dto) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, companyId, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        if (item.siteId !== dto.siteFromId) {
            throw new common_1.BadRequestException('Source site does not match the inventory item site');
        }
        const destSite = await this.prisma.constructionSite.findFirst({
            where: { id: dto.siteToId, companyId, deletedAt: null },
        });
        if (!destSite) {
            throw new common_1.NotFoundException('Destination site not found');
        }
        if (dto.siteFromId === dto.siteToId) {
            throw new common_1.BadRequestException('Source and destination sites cannot be the same');
        }
        const currentQty = Number(item.quantityOnHand);
        if (currentQty < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock for transfer. Available: ${currentQty}, Transfer: ${dto.quantity}`);
        }
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    itemId,
                    companyId,
                    type: 'TRANSFER',
                    quantity: dto.quantity,
                    siteFromId: dto.siteFromId,
                    siteToId: dto.siteToId,
                    recordedById: userId,
                },
            });
            const updatedItem = await tx.inventoryItem.update({
                where: { id: itemId },
                data: {
                    quantityOnHand: { decrement: dto.quantity },
                    lastUpdated: new Date(),
                },
                include: {
                    materials: true,
                    constructionSites: true,
                },
            });
            const destItem = await tx.inventoryItem.upsert({
                where: {
                    companyId_siteId_materialId: {
                        companyId,
                        siteId: dto.siteToId,
                        materialId: item.materialId,
                    },
                },
                update: {
                    quantityOnHand: { increment: dto.quantity },
                    lastUpdated: new Date(),
                },
                create: {
                    companyId,
                    siteId: dto.siteToId,
                    materialId: item.materialId,
                    quantityOnHand: dto.quantity,
                    lowStockThreshold: item.lowStockThreshold,
                },
            });
            return { transaction, item: updatedItem, destinationItem: destItem };
        });
    }
    async getLowStockAlerts(companyId) {
        const items = await this.prisma.$queryRaw `
      SELECT * FROM inventory_items
      WHERE company_id = ${companyId}
        AND deleted_at IS NULL
        AND CAST(quantity_on_hand AS NUMERIC) <= low_stock_threshold
      ORDER BY CAST(quantity_on_hand AS NUMERIC) ASC
    `;
        if (items.length === 0)
            return [];
        const ids = items.map((i) => i.id);
        return this.prisma.inventoryItem.findMany({
            where: { id: { in: ids }, deletedAt: null },
            include: {
                materials: true,
                constructionSites: true,
            },
            orderBy: { quantityOnHand: 'asc' },
        });
    }
    async getStockSummary(companyId) {
        const summary = await this.prisma.$queryRaw `
      SELECT
        ci.id AS site_id,
        ci.name AS site_name,
        COUNT(ii.id) AS total_items,
        COALESCE(SUM(CAST(ii.quantity_on_hand AS NUMERIC)), 0) AS total_quantity,
        COUNT(ii.id) FILTER (
          WHERE CAST(ii.quantity_on_hand AS NUMERIC) <= ii.low_stock_threshold
        ) AS low_stock_count
      FROM inventory_items ii
      JOIN construction_sites ci ON ci.id = ii.site_id
      WHERE ii.company_id = ${companyId}
        AND ii.deleted_at IS NULL
        AND ci.deleted_at IS NULL
      GROUP BY ci.id, ci.name
      ORDER BY ci.name ASC
    `;
        return summary.map((row) => ({
            siteId: row.site_id,
            siteName: row.site_name,
            totalItems: Number(row.total_items),
            totalQuantity: Number(row.total_quantity),
            lowStockCount: Number(row.low_stock_count),
        }));
    }
    async createSnapshots(companyId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const items = await this.prisma.inventoryItem.findMany({
            where: { companyId, deletedAt: null },
            select: { id: true, quantityOnHand: true },
        });
        if (items.length === 0) {
            return { created: 0, message: 'No inventory items to snapshot' };
        }
        const existingSnapshots = await this.prisma.inventorySnapshot.findMany({
            where: {
                itemId: { in: items.map((i) => i.id) },
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
            },
            select: { itemId: true },
        });
        const existingIds = new Set(existingSnapshots.map((s) => s.itemId));
        const newItems = items.filter((i) => !existingIds.has(i.id));
        if (newItems.length === 0) {
            return { created: 0, message: 'Snapshots already exist for today' };
        }
        const result = await this.prisma.inventorySnapshot.createMany({
            data: newItems.map((item) => ({
                itemId: item.id,
                quantity: Number(item.quantityOnHand),
                companyId,
            })),
        });
        return { created: result.count, message: `Created ${result.count} snapshots` };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map
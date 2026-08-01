import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RecordInwardDto, RecordOutwardDto, RecordWastageDto, RecordTransferDto } from './dto/record-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────

  async create(companyId: string, dto: CreateInventoryItemDto) {
    // Verify material belongs to company
    const material = await this.prisma.material.findFirst({
      where: { id: dto.materialId, companyId, deletedAt: null },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Verify site belongs to company
    const site = await this.prisma.constructionSite.findFirst({
      where: { id: dto.siteId, companyId, deletedAt: null },
    });
    if (!site) {
      throw new NotFoundException('Construction site not found');
    }

    // Check for duplicate (unique constraint: companyId + siteId + materialId)
    const existing = await this.prisma.inventoryItem.findFirst({
      where: {
        companyId,
        siteId: dto.siteId,
        materialId: dto.materialId,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        'An inventory item for this material already exists at this site',
      );
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

  async findAll(companyId: string, query: QueryInventoryDto) {
    // For lowStock filter, use a raw query since Prisma can't compare two columns
    if (query.lowStock === true) {
      const items = await this.prisma.$queryRaw<
        Array<{
          id: string;
          companyId: string;
          siteId: string;
          materialId: string;
          quantityOnHand: Prisma.Decimal;
          lowStockThreshold: number;
          lastUpdated: Date;
          deletedAt: Date | null;
        }>
      >`
        SELECT * FROM inventory_items
        WHERE company_id = ${companyId}
          AND deleted_at IS NULL
          AND CAST(quantity_on_hand AS NUMERIC) <= low_stock_threshold
      `;

      // Apply optional site/material filters on the raw results
      let filtered = items;
      if (query.siteId) {
        filtered = filtered.filter((i) => i.siteId === query.siteId);
      }
      if (query.materialId) {
        filtered = filtered.filter((i) => i.materialId === query.materialId);
      }

      // Fetch full relations for filtered items
      const ids = filtered.map((i) => i.id);
      if (ids.length === 0) return [];

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

  async findOne(companyId: string, id: string) {
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
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async update(companyId: string, id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const data: Prisma.InventoryItemUpdateInput = {};

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

  // ─── TRANSACTIONS ──────────────────────────────────────────────────

  async recordInward(companyId: string, itemId: string, userId: string, dto: RecordInwardDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
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

  async recordOutward(companyId: string, itemId: string, userId: string, dto: RecordOutwardDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const currentQty = Number(item.quantityOnHand);
    if (currentQty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${currentQty}, Requested: ${dto.quantity}`,
      );
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

  async recordWastage(companyId: string, itemId: string, userId: string, dto: RecordWastageDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const currentQty = Number(item.quantityOnHand);
    if (currentQty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for wastage. Available: ${currentQty}, Wastage: ${dto.quantity}`,
      );
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

  async recordTransfer(
    companyId: string,
    itemId: string,
    userId: string,
    dto: RecordTransferDto,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, companyId, deletedAt: null },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Validate source site matches item's site
    if (item.siteId !== dto.siteFromId) {
      throw new BadRequestException(
        'Source site does not match the inventory item site',
      );
    }

    // Verify destination site belongs to company
    const destSite = await this.prisma.constructionSite.findFirst({
      where: { id: dto.siteToId, companyId, deletedAt: null },
    });
    if (!destSite) {
      throw new NotFoundException('Destination site not found');
    }

    if (dto.siteFromId === dto.siteToId) {
      throw new BadRequestException('Source and destination sites cannot be the same');
    }

    const currentQty = Number(item.quantityOnHand);
    if (currentQty < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for transfer. Available: ${currentQty}, Transfer: ${dto.quantity}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Record the transfer transaction
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

      // Reduce quantity at source
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

      // Upsert inventory item at destination (or create if not exists)
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

  // ─── QUERIES ───────────────────────────────────────────────────────

  async getLowStockAlerts(companyId: string) {
    // Use raw query to compare two columns (quantityOnHand <= lowStockThreshold)
    const items = await this.prisma.$queryRaw<
      Array<{
        id: string;
        company_id: string;
        site_id: string;
        material_id: string;
        quantity_on_hand: Prisma.Decimal;
        low_stock_threshold: number;
        last_updated: Date;
        deleted_at: Date | null;
      }>
    >`
      SELECT * FROM inventory_items
      WHERE company_id = ${companyId}
        AND deleted_at IS NULL
        AND CAST(quantity_on_hand AS NUMERIC) <= low_stock_threshold
      ORDER BY CAST(quantity_on_hand AS NUMERIC) ASC
    `;

    if (items.length === 0) return [];

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

  async getStockSummary(companyId: string) {
    const summary = await this.prisma.$queryRaw<
      Array<{
        site_id: string;
        site_name: string;
        total_items: bigint;
        total_quantity: Prisma.Decimal;
        low_stock_count: bigint;
      }>
    >`
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

  // ─── SNAPSHOTS ─────────────────────────────────────────────────────

  async createSnapshots(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await this.prisma.inventoryItem.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true, quantityOnHand: true },
    });

    if (items.length === 0) {
      return { created: 0, message: 'No inventory items to snapshot' };
    }

    // Check if snapshots already exist for today
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
}

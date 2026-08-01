import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConstructionService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Sites ---
  async createSite(dto: any, companyId: string) {
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

  async findAllSites(query: any, companyId: string) {
    const where: Prisma.ConstructionSiteWhereInput = { companyId };
    if (query.status) where.status = query.status;
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

  async findOneSite(id: string, companyId: string) {
    const site = await this.prisma.constructionSite.findFirst({
      where: { id, companyId },
      include: {
        sitePhases: { orderBy: { sortOrder: 'asc' } },
        progressPhotos: { orderBy: { takenAt: 'desc' }, take: 10 },
      },
    });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async updateSite(id: string, dto: any, companyId: string) {
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

  async deleteSite(id: string, companyId: string) {
    await this.findOneSite(id, companyId);
    return this.prisma.constructionSite.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Phases ---
  async createPhase(siteId: string, dto: any, companyId: string) {
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

  async updatePhase(id: string, dto: any, companyId: string) {
    const phase = await this.prisma.sitePhase.findFirst({
      where: { id, constructionSites: { companyId } },
    });
    if (!phase) throw new NotFoundException('Phase not found');
    return this.prisma.sitePhase.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deletePhase(id: string, companyId: string) {
    const phase = await this.prisma.sitePhase.findFirst({
      where: { id, constructionSites: { companyId } },
    });
    if (!phase) throw new NotFoundException('Phase not found');
    return this.prisma.sitePhase.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Vendors ---
  async createVendor(dto: any, companyId: string) {
    const { name, contactPerson, phone, email, address, gstin, status } = dto;
    return this.prisma.vendor.create({
      data: { name, contactPerson, phone, email, address, gstin, status, companyId },
    });
  }

  async findAllVendors(query: any, companyId: string) {
    const where: Prisma.VendorWhereInput = { companyId };
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

  async findOneVendor(id: string, companyId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, companyId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateVendor(id: string, dto: any, companyId: string) {
    await this.findOneVendor(id, companyId);
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  async deleteVendor(id: string, companyId: string) {
    await this.findOneVendor(id, companyId);
    return this.prisma.vendor.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Materials ---
  async createMaterial(dto: any, companyId: string) {
    const { name, category, unit, unitPrice } = dto;
    await this.prisma.material.deleteMany({
      where: { companyId, name, deletedAt: { not: null } },
    });
    return this.prisma.material.create({
      data: { name, category, unit, unitPrice, companyId },
    });
  }

  async findAllMaterials(query: any, companyId: string) {
    const where: Prisma.MaterialWhereInput = { companyId, deletedAt: null };
    if (query.category) where.category = query.category;
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

  async updateMaterial(id: string, dto: any, companyId: string) {
    const mat = await this.prisma.material.findFirst({
      where: { id, companyId },
    });
    if (!mat) throw new NotFoundException('Material not found');
    return this.prisma.material.update({
      where: { id },
      data: { ...dto, unitPrice: dto.unitPrice ?? undefined },
    });
  }

  async deleteMaterial(id: string, companyId: string) {
    const mat = await this.prisma.material.findFirst({
      where: { id, companyId },
    });
    if (!mat) throw new NotFoundException('Material not found');
    return this.prisma.material.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Material Inward ---
  async createMaterialInward(dto: any, companyId: string) {
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

  async findAllMaterialInward(query: any, companyId: string) {
    const where: Prisma.MaterialInwardWhereInput = { companyId };
    if (query.siteId) where.siteId = query.siteId;
    if (query.vendorId) where.vendorId = query.vendorId;
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

  async updateMaterialInward(id: string, dto: any, companyId: string) {
    const entry = await this.prisma.materialInward.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Material inward entry not found');

    const updateData: any = { ...dto };
    if (dto.receivedDate) updateData.receivedDate = new Date(dto.receivedDate);
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

  async deleteMaterialInward(id: string, companyId: string) {
    const entry = await this.prisma.materialInward.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Material inward entry not found');

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

  // --- Inventory ---
  async findInventory(query: any, companyId: string) {
    const where: Prisma.InventoryItemWhereInput = { companyId };
    if (query.siteId) where.siteId = query.siteId;
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

  // --- Labour ---
  async createLabourEntry(dto: any, companyId: string) {
    return this.prisma.labourEntry.create({
      data: {
        ...dto,
        companyId,
        date: new Date(dto.date),
        hoursWorked: dto.hoursWorked ?? undefined,
      },
    });
  }

  async findAllLabourEntries(query: any, companyId: string) {
    const where: Prisma.LabourEntryWhereInput = { companyId };
    if (query.siteId) where.siteId = query.siteId;
    if (query.date) where.date = new Date(query.date);
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

  async deleteLabourEntry(id: string, companyId: string) {
    const entry = await this.prisma.labourEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Labour entry not found');
    return this.prisma.labourEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // --- Material Consumption ---
  async createConsumption(dto: any, companyId: string, userId: string) {
    const material = await this.prisma.material.findFirst({
      where: { id: dto.materialId, companyId, deletedAt: null },
    });
    if (!material) throw new NotFoundException('Material not found');

    const site = await this.prisma.constructionSite.findFirst({
      where: { id: dto.siteId, companyId, deletedAt: null },
    });
    if (!site) throw new NotFoundException('Construction site not found');

    if (dto.phaseId) {
      const phase = await this.prisma.sitePhase.findFirst({
        where: { id: dto.phaseId, siteId: dto.siteId, deletedAt: null },
      });
      if (!phase) throw new NotFoundException('Phase not found');
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
          throw new BadRequestException(
            `Insufficient stock. Available: ${currentQty}, Required: ${dto.quantity}`,
          );
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

  async findAllConsumptions(query: any, companyId: string) {
    const where: Prisma.MaterialConsumptionWhereInput = { companyId };
    if (query.siteId) where.siteId = query.siteId;
    if (query.materialId) where.materialId = query.materialId;
    if (query.phaseId) where.phaseId = query.phaseId;

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

  async deleteConsumption(id: string, companyId: string) {
    const consumption = await this.prisma.materialConsumption.findFirst({
      where: { id, companyId },
    });
    if (!consumption) throw new NotFoundException('Consumption record not found');

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

  // --- Progress Photos ---
  async createProgressPhoto(dto: any, companyId: string) {
    return this.prisma.progressPhoto.create({
      data: {
        ...dto,
        companyId,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : new Date(),
      },
    });
  }

  async findSitePhotos(siteId: string, companyId: string) {
    await this.findOneSite(siteId, companyId);
    return this.prisma.progressPhoto.findMany({
      where: { siteId, companyId },
      orderBy: { takenAt: 'desc' },
      include: { sitePhases: { select: { name: true } } },
    });
  }

  async deleteProgressPhoto(id: string, companyId: string) {
    const photo = await this.prisma.progressPhoto.findFirst({
      where: { id, companyId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    return this.prisma.progressPhoto.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { Prisma, AssetStatus } from '@prisma/client';
import {
  CreateAssetDto,
  UpdateAssetDto,
  QueryAssetDto,
} from './dto/create-asset.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateRepairDto, UpdateRepairDto } from './dto/create-repair.dto';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transitionService: TransitionService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────

  async findAll(companyId: string, query: QueryAssetDto) {
    const { status, category, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {
      companyId,
      deletedAt: null,
      ...(status && { status: status as AssetStatus }),
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

  async create(companyId: string, dto: CreateAssetDto) {
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

  async findOne(companyId: string, id: string) {
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

    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async update(companyId: string, id: string, dto: UpdateAssetDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');

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

  async remove(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'RETIRED' },
    });
  }

  // ─── ASSIGNMENTS ──────────────────────────────────────────────────

  async assign(companyId: string, id: string, dto: CreateAssignmentDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    this.transitionService.validate('Asset', asset.status, 'ASSIGNED');

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

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

  async returnAsset(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    this.transitionService.validate('Asset', asset.status, 'AVAILABLE');

    return this.prisma.$transaction(async (tx) => {
      // Close the most recent open assignment
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

  async listAssignments(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');

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

  // ─── REPAIRS ──────────────────────────────────────────────────────

  async createRepair(companyId: string, id: string, dto: CreateRepairDto) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Asset not found');
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

  async updateRepair(companyId: string, repairId: string, dto: UpdateRepairDto) {
    const repair = await this.prisma.assetRepair.findFirst({
      where: { id: repairId },
      include: { asset: true },
    });
    if (!repair || repair.asset.companyId !== companyId) {
      throw new NotFoundException('Repair record not found');
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

    // If repair is completed, return asset to AVAILABLE
    if (dto.status === 'COMPLETED') {
      this.transitionService.validate('Asset', repair.asset.status, 'AVAILABLE');
      await this.prisma.asset.update({
        where: { id: repair.assetId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────

  async getSummary(companyId: string) {
    const counts = await this.prisma.asset.groupBy({
      by: ['status'],
      where: { companyId, deletedAt: null },
      _count: { id: true },
    });

    const summary: Record<string, number> = {
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
}

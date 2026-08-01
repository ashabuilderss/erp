import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateExportConfigDto,
  UpdateExportConfigDto,
} from './dto/export-config.dto';

@Injectable()
export class ExportConfigService {
  private readonly logger = new Logger(ExportConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(companyId: string) {
    return this.prisma.exportConfig.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        exportType: true,
        sheetId: true,
        sheetName: true,
        syncEnabled: true,
        syncSchedule: true,
        syncStatus: true,
        allowedRoles: true,
        grantedUsers: true,
        lastSyncedAt: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getById(companyId: string, id: string) {
    const config = await this.prisma.exportConfig.findFirst({
      where: { id, companyId },
    });
    if (!config) throw new NotFoundException(`ExportConfig ${id} not found`);
    return config;
  }

  async create(companyId: string, dto: CreateExportConfigDto) {
    const existing = await this.prisma.exportConfig.findUnique({
      where: {
        companyId_exportType: { companyId, exportType: dto.exportType },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Export config for '${dto.exportType}' already exists`,
      );
    }

    const config = await this.prisma.exportConfig.create({
      data: {
        companyId,
        exportType: dto.exportType,
        sheetId: dto.sheetId ?? null,
        sheetName: dto.sheetName ?? null,
        syncEnabled: dto.syncEnabled ?? false,
        syncSchedule: dto.syncSchedule ?? null,
        allowedRoles: dto.allowedRoles,
        grantedUsers: dto.grantedUsers ?? [],
      },
    });

    this.logger.log(
      `Created ExportConfig ${config.id} for type '${config.exportType}'`,
    );
    return config;
  }

  async update(companyId: string, id: string, dto: UpdateExportConfigDto) {
    const existing = await this.getById(companyId, id);

    const config = await this.prisma.exportConfig.update({
      where: { id },
      data: {
        ...(dto.sheetId !== undefined && { sheetId: dto.sheetId }),
        ...(dto.sheetName !== undefined && { sheetName: dto.sheetName }),
        ...(dto.syncEnabled !== undefined && { syncEnabled: dto.syncEnabled }),
        ...(dto.syncSchedule !== undefined && {
          syncSchedule: dto.syncSchedule,
        }),
        ...(dto.allowedRoles !== undefined && {
          allowedRoles: dto.allowedRoles,
        }),
        ...(dto.grantedUsers !== undefined && {
          grantedUsers: dto.grantedUsers,
        }),
      },
    });

    this.logger.log(`Updated ExportConfig ${id}`);
    return config;
  }

  async remove(companyId: string, id: string) {
    await this.getById(companyId, id);
    await this.prisma.exportConfig.update({ where: { id }, data: { deletedAt: new Date() } });
    this.logger.log(`Deleted ExportConfig ${id}`);
  }

  async getEnabledConfigs() {
    return this.prisma.exportConfig.findMany({
      where: { syncEnabled: true },
      include: { companies: { select: { id: true, name: true } } },
    });
  }
}

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
var ExportConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ExportConfigService = ExportConfigService_1 = class ExportConfigService {
    prisma;
    auditService;
    logger = new common_1.Logger(ExportConfigService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async list(companyId) {
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
    async getById(companyId, id) {
        const config = await this.prisma.exportConfig.findFirst({
            where: { id, companyId },
        });
        if (!config)
            throw new common_1.NotFoundException(`ExportConfig ${id} not found`);
        return config;
    }
    async create(companyId, dto) {
        const existing = await this.prisma.exportConfig.findUnique({
            where: {
                companyId_exportType: { companyId, exportType: dto.exportType },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Export config for '${dto.exportType}' already exists`);
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
        this.logger.log(`Created ExportConfig ${config.id} for type '${config.exportType}'`);
        return config;
    }
    async update(companyId, id, dto) {
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
    async remove(companyId, id) {
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
};
exports.ExportConfigService = ExportConfigService;
exports.ExportConfigService = ExportConfigService = ExportConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ExportConfigService);
//# sourceMappingURL=export-config.service.js.map
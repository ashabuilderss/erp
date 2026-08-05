import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateExportConfigDto, UpdateExportConfigDto } from './dto/export-config.dto';
export declare class ExportConfigService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    list(companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        exportType: string;
        sheetId: string | null;
        sheetName: string | null;
        syncEnabled: boolean;
        syncSchedule: string | null;
        syncStatus: import(".prisma/client").$Enums.ExportSyncStatus;
        allowedRoles: Prisma.JsonValue;
        grantedUsers: Prisma.JsonValue;
        lastSyncedAt: Date | null;
        lastSyncError: string | null;
    }[]>;
    getById(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        exportType: string;
        sheetId: string | null;
        sheetName: string | null;
        syncEnabled: boolean;
        syncSchedule: string | null;
        syncStatus: import(".prisma/client").$Enums.ExportSyncStatus;
        allowedRoles: Prisma.JsonValue;
        grantedUsers: Prisma.JsonValue;
        lastSyncedAt: Date | null;
        lastSyncError: string | null;
    }>;
    create(companyId: string, dto: CreateExportConfigDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        exportType: string;
        sheetId: string | null;
        sheetName: string | null;
        syncEnabled: boolean;
        syncSchedule: string | null;
        syncStatus: import(".prisma/client").$Enums.ExportSyncStatus;
        allowedRoles: Prisma.JsonValue;
        grantedUsers: Prisma.JsonValue;
        lastSyncedAt: Date | null;
        lastSyncError: string | null;
    }>;
    update(companyId: string, id: string, dto: UpdateExportConfigDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        exportType: string;
        sheetId: string | null;
        sheetName: string | null;
        syncEnabled: boolean;
        syncSchedule: string | null;
        syncStatus: import(".prisma/client").$Enums.ExportSyncStatus;
        allowedRoles: Prisma.JsonValue;
        grantedUsers: Prisma.JsonValue;
        lastSyncedAt: Date | null;
        lastSyncError: string | null;
    }>;
    remove(companyId: string, id: string): Promise<void>;
    getEnabledConfigs(): Promise<({
        companies: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        exportType: string;
        sheetId: string | null;
        sheetName: string | null;
        syncEnabled: boolean;
        syncSchedule: string | null;
        syncStatus: import(".prisma/client").$Enums.ExportSyncStatus;
        allowedRoles: Prisma.JsonValue;
        grantedUsers: Prisma.JsonValue;
        lastSyncedAt: Date | null;
        lastSyncError: string | null;
    })[]>;
}

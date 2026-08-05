import { PrismaService } from '../../config/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { EncryptionService } from '../../common/services/encryption.service';
import type { Prisma } from '@prisma/client';
import type { SystemSettings } from './interfaces/company-settings.interface';
export declare class CompaniesService {
    private prisma;
    private encryptionService;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    findAll(companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: Prisma.JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }[]>;
    findById(id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: Prisma.JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }>;
    update(id: string, dto: UpdateCompanyDto): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: Prisma.JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }>;
    getSettings(companyId: string): Promise<SystemSettings>;
    updateSettings(companyId: string, dto: UpdateSettingsDto): Promise<SystemSettings>;
}

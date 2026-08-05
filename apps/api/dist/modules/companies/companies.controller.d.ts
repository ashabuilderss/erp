import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    findAll(companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }[]>;
    findCurrent(companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }>;
    updateCurrent(dto: UpdateCompanyDto, companyId: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        settings: import("@prisma/client/runtime/client").JsonValue | null;
        gstin: string | null;
        pan: string | null;
    }>;
    getSettings(companyId: string): Promise<import("./interfaces/company-settings.interface").SystemSettings>;
    updateSettings(dto: UpdateSettingsDto, companyId: string): Promise<import("./interfaces/company-settings.interface").SystemSettings>;
}

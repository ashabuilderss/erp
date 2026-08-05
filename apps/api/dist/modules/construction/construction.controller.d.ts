import { ConstructionService } from './construction.service';
import { CreateSiteDto, UpdateSiteDto, QuerySiteDto, CreatePhaseDto, UpdatePhaseDto, CreateVendorDto, UpdateVendorDto, QueryVendorDto, CreateMaterialDto, UpdateMaterialDto, QueryMaterialDto, CreateMaterialInwardDto, UpdateMaterialInwardDto, CreateLabourEntryDto, CreateProgressPhotoDto, CreateConsumptionDto } from './dto';
import { QueryMaterialInwardDto } from './dto/query-material-inward.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { QueryLabourEntryDto } from './dto/query-labour-entry.dto';
import { QueryConsumptionDto } from './dto/query-consumption.dto';
export declare class ConstructionController {
    private readonly service;
    constructor(service: ConstructionService);
    createSite(dto: CreateSiteDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SiteStatus;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
        budget: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    findAllSites(query: QuerySiteDto, companyId: string): Promise<{
        data: ({
            _count: {
                labourEntries: number;
                progressPhotos: number;
                sitePhases: number;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string | null;
            status: import(".prisma/client").$Enums.SiteStatus;
            location: string;
            startDate: Date | null;
            endDate: Date | null;
            budget: import("@prisma/client-runtime-utils").Decimal | null;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findOneSite(id: string, companyId: string): Promise<{
        progressPhotos: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            photoUrl: string;
            takenAt: Date;
            siteId: string;
            phaseId: string | null;
            caption: string | null;
        }[];
        sitePhases: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string | null;
            status: import(".prisma/client").$Enums.SitePhaseStatus;
            sortOrder: number;
            startDate: Date | null;
            endDate: Date | null;
            siteId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SiteStatus;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
        budget: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    updateSite(id: string, dto: UpdateSiteDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SiteStatus;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
        budget: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    deleteSite(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SiteStatus;
        location: string;
        startDate: Date | null;
        endDate: Date | null;
        budget: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    createPhase(siteId: string, dto: CreatePhaseDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SitePhaseStatus;
        sortOrder: number;
        startDate: Date | null;
        endDate: Date | null;
        siteId: string;
    }>;
    updatePhase(id: string, dto: UpdatePhaseDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SitePhaseStatus;
        sortOrder: number;
        startDate: Date | null;
        endDate: Date | null;
        siteId: string;
    }>;
    deletePhase(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.SitePhaseStatus;
        sortOrder: number;
        startDate: Date | null;
        endDate: Date | null;
        siteId: string;
    }>;
    createVendor(dto: CreateVendorDto, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.VendorStatus;
        phone: string | null;
        address: string | null;
        gstin: string | null;
        contactPerson: string | null;
        rating: number | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    findAllVendors(query: QueryVendorDto, companyId: string): Promise<{
        data: {
            name: string;
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.VendorStatus;
            phone: string | null;
            address: string | null;
            gstin: string | null;
            contactPerson: string | null;
            rating: number | null;
            isBlacklisted: boolean;
            blacklistReason: string | null;
        }[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findOneVendor(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.VendorStatus;
        phone: string | null;
        address: string | null;
        gstin: string | null;
        contactPerson: string | null;
        rating: number | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    updateVendor(id: string, dto: UpdateVendorDto, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.VendorStatus;
        phone: string | null;
        address: string | null;
        gstin: string | null;
        contactPerson: string | null;
        rating: number | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    deleteVendor(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.VendorStatus;
        phone: string | null;
        address: string | null;
        gstin: string | null;
        contactPerson: string | null;
        rating: number | null;
        isBlacklisted: boolean;
        blacklistReason: string | null;
    }>;
    createMaterial(dto: CreateMaterialDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        category: string;
        unit: string;
        unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    findAllMaterials(query: QueryMaterialDto, companyId: string): Promise<{
        data: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    updateMaterial(id: string, dto: UpdateMaterialDto, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        category: string;
        unit: string;
        unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    deleteMaterial(id: string, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        category: string;
        unit: string;
        unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    createMaterialInward(dto: CreateMaterialInwardDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        siteId: string;
        unitPrice: import("@prisma/client-runtime-utils").Decimal;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        receivedDate: Date;
        invoiceUrl: string | null;
        vendorId: string;
        materialId: string;
    }>;
    updateMaterialInward(id: string, dto: UpdateMaterialInwardDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        siteId: string;
        unitPrice: import("@prisma/client-runtime-utils").Decimal;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        receivedDate: Date;
        invoiceUrl: string | null;
        vendorId: string;
        materialId: string;
    }>;
    deleteMaterialInward(id: string, companyId: string): Promise<void>;
    findAllMaterialInward(query: QueryMaterialInwardDto, companyId: string): Promise<{
        data: ({
            vendors: {
                name: string;
            };
            materials: {
                name: string;
                unit: string;
            };
            constructionSites: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            notes: string | null;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
            siteId: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            receivedDate: Date;
            invoiceUrl: string | null;
            vendorId: string;
            materialId: string;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findInventory(query: QueryInventoryDto, companyId: string): Promise<({
        materials: {
            name: string;
            category: string;
            unit: string;
        };
        constructionSites: {
            name: string;
        };
    } & {
        id: string;
        companyId: string;
        deletedAt: Date | null;
        siteId: string;
        materialId: string;
        quantityOnHand: import("@prisma/client-runtime-utils").Decimal;
        lowStockThreshold: number;
        lastUpdated: Date;
    })[]>;
    createLabourEntry(dto: CreateLabourEntryDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        date: Date;
        siteId: string;
        labourName: string;
        labourType: import(".prisma/client").$Enums.LabourType;
        hoursWorked: import("@prisma/client-runtime-utils").Decimal | null;
        wagesAmount: import("@prisma/client-runtime-utils").Decimal;
    }>;
    findAllLabourEntries(query: QueryLabourEntryDto, companyId: string): Promise<{
        data: ({
            constructionSites: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            notes: string | null;
            date: Date;
            siteId: string;
            labourName: string;
            labourType: import(".prisma/client").$Enums.LabourType;
            hoursWorked: import("@prisma/client-runtime-utils").Decimal | null;
            wagesAmount: import("@prisma/client-runtime-utils").Decimal;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    deleteLabourEntry(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        date: Date;
        siteId: string;
        labourName: string;
        labourType: import(".prisma/client").$Enums.LabourType;
        hoursWorked: import("@prisma/client-runtime-utils").Decimal | null;
        wagesAmount: import("@prisma/client-runtime-utils").Decimal;
    }>;
    createConsumption(dto: CreateConsumptionDto, companyId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        siteId: string;
        phaseId: string | null;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        materialId: string;
        consumedDate: Date;
    }>;
    findAllConsumptions(query: QueryConsumptionDto, companyId: string): Promise<{
        data: ({
            materials: {
                name: string;
                unit: string;
            };
            constructionSites: {
                name: string;
            };
            sitePhases: {
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            notes: string | null;
            siteId: string;
            phaseId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            materialId: string;
            consumedDate: Date;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    deleteConsumption(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        siteId: string;
        phaseId: string | null;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        materialId: string;
        consumedDate: Date;
    }>;
    createProgressPhoto(dto: CreateProgressPhotoDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        photoUrl: string;
        takenAt: Date;
        siteId: string;
        phaseId: string | null;
        caption: string | null;
    }>;
    findSitePhotos(siteId: string, companyId: string): Promise<({
        sitePhases: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        photoUrl: string;
        takenAt: Date;
        siteId: string;
        phaseId: string | null;
        caption: string | null;
    })[]>;
    deleteProgressPhoto(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        photoUrl: string;
        takenAt: Date;
        siteId: string;
        phaseId: string | null;
        caption: string | null;
    }>;
}

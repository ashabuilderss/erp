import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';
export declare class ConstructionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSite(dto: any, companyId: string): Promise<{
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
        budget: Prisma.Decimal | null;
    }>;
    findAllSites(query: any, companyId: string): Promise<{
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
            budget: Prisma.Decimal | null;
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
        budget: Prisma.Decimal | null;
    }>;
    updateSite(id: string, dto: any, companyId: string): Promise<{
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
        budget: Prisma.Decimal | null;
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
        budget: Prisma.Decimal | null;
    }>;
    createPhase(siteId: string, dto: any, companyId: string): Promise<{
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
    updatePhase(id: string, dto: any, companyId: string): Promise<{
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
    createVendor(dto: any, companyId: string): Promise<{
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
    findAllVendors(query: any, companyId: string): Promise<{
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
    updateVendor(id: string, dto: any, companyId: string): Promise<{
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
    createMaterial(dto: any, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        category: string;
        unit: string;
        unitPrice: Prisma.Decimal | null;
    }>;
    findAllMaterials(query: any, companyId: string): Promise<{
        data: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: Prisma.Decimal | null;
        }[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    updateMaterial(id: string, dto: any, companyId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        category: string;
        unit: string;
        unitPrice: Prisma.Decimal | null;
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
        unitPrice: Prisma.Decimal | null;
    }>;
    createMaterialInward(dto: any, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        totalAmount: Prisma.Decimal;
        siteId: string;
        unitPrice: Prisma.Decimal;
        quantity: Prisma.Decimal;
        receivedDate: Date;
        invoiceUrl: string | null;
        vendorId: string;
        materialId: string;
    }>;
    findAllMaterialInward(query: any, companyId: string): Promise<{
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
            totalAmount: Prisma.Decimal;
            siteId: string;
            unitPrice: Prisma.Decimal;
            quantity: Prisma.Decimal;
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
    updateMaterialInward(id: string, dto: any, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        totalAmount: Prisma.Decimal;
        siteId: string;
        unitPrice: Prisma.Decimal;
        quantity: Prisma.Decimal;
        receivedDate: Date;
        invoiceUrl: string | null;
        vendorId: string;
        materialId: string;
    }>;
    deleteMaterialInward(id: string, companyId: string): Promise<void>;
    findInventory(query: any, companyId: string): Promise<({
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
        quantityOnHand: Prisma.Decimal;
        lowStockThreshold: number;
        lastUpdated: Date;
    })[]>;
    createLabourEntry(dto: any, companyId: string): Promise<{
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
        hoursWorked: Prisma.Decimal | null;
        wagesAmount: Prisma.Decimal;
    }>;
    findAllLabourEntries(query: any, companyId: string): Promise<{
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
            hoursWorked: Prisma.Decimal | null;
            wagesAmount: Prisma.Decimal;
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
        hoursWorked: Prisma.Decimal | null;
        wagesAmount: Prisma.Decimal;
    }>;
    createConsumption(dto: any, companyId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        notes: string | null;
        siteId: string;
        phaseId: string | null;
        quantity: Prisma.Decimal;
        materialId: string;
        consumedDate: Date;
    }>;
    findAllConsumptions(query: any, companyId: string): Promise<{
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
            quantity: Prisma.Decimal;
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
        quantity: Prisma.Decimal;
        materialId: string;
        consumedDate: Date;
    }>;
    createProgressPhoto(dto: any, companyId: string): Promise<{
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

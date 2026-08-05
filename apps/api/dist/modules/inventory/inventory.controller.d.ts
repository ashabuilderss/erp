import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RecordInwardDto, RecordOutwardDto, RecordWastageDto, RecordTransferDto } from './dto/record-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(companyId: string, query: QueryInventoryDto): Promise<({
        materials: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
        constructionSites: {
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
    create(companyId: string, dto: CreateInventoryItemDto): Promise<{
        materials: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
        constructionSites: {
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
    }>;
    getLowStockAlerts(companyId: string): Promise<({
        materials: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
        constructionSites: {
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
    getStockSummary(companyId: string): Promise<{
        siteId: string;
        siteName: string;
        totalItems: number;
        totalQuantity: number;
        lowStockCount: number;
    }[]>;
    createSnapshots(companyId: string): Promise<{
        created: number;
        message: string;
    }>;
    findOne(companyId: string, id: string): Promise<{
        materials: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
        constructionSites: {
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
        };
        transactions: ({
            siteFrom: {
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
            } | null;
            siteTo: {
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
            } | null;
            recordedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            id: string;
            companyId: string;
            date: Date;
            quantity: number;
            itemId: string;
            siteFromId: string | null;
            siteToId: string | null;
            recordedById: string;
        })[];
    } & {
        id: string;
        companyId: string;
        deletedAt: Date | null;
        siteId: string;
        materialId: string;
        quantityOnHand: import("@prisma/client-runtime-utils").Decimal;
        lowStockThreshold: number;
        lastUpdated: Date;
    }>;
    update(companyId: string, id: string, dto: UpdateInventoryItemDto): Promise<{
        materials: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            category: string;
            unit: string;
            unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
        constructionSites: {
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
    }>;
    recordInward(companyId: string, userId: string, id: string, dto: RecordInwardDto): Promise<{
        transaction: {
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            id: string;
            companyId: string;
            date: Date;
            quantity: number;
            itemId: string;
            siteFromId: string | null;
            siteToId: string | null;
            recordedById: string;
        };
        item: {
            materials: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                category: string;
                unit: string;
                unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
            };
            constructionSites: {
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
        };
    }>;
    recordOutward(companyId: string, userId: string, id: string, dto: RecordOutwardDto): Promise<{
        transaction: {
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            id: string;
            companyId: string;
            date: Date;
            quantity: number;
            itemId: string;
            siteFromId: string | null;
            siteToId: string | null;
            recordedById: string;
        };
        item: {
            materials: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                category: string;
                unit: string;
                unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
            };
            constructionSites: {
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
        };
    }>;
    recordWastage(companyId: string, userId: string, id: string, dto: RecordWastageDto): Promise<{
        transaction: {
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            id: string;
            companyId: string;
            date: Date;
            quantity: number;
            itemId: string;
            siteFromId: string | null;
            siteToId: string | null;
            recordedById: string;
        };
        item: {
            materials: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                category: string;
                unit: string;
                unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
            };
            constructionSites: {
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
        };
    }>;
    recordTransfer(companyId: string, userId: string, id: string, dto: RecordTransferDto): Promise<{
        transaction: {
            type: import(".prisma/client").$Enums.InventoryTransactionType;
            id: string;
            companyId: string;
            date: Date;
            quantity: number;
            itemId: string;
            siteFromId: string | null;
            siteToId: string | null;
            recordedById: string;
        };
        item: {
            materials: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                category: string;
                unit: string;
                unitPrice: import("@prisma/client-runtime-utils").Decimal | null;
            };
            constructionSites: {
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
        };
        destinationItem: {
            id: string;
            companyId: string;
            deletedAt: Date | null;
            siteId: string;
            materialId: string;
            quantityOnHand: import("@prisma/client-runtime-utils").Decimal;
            lowStockThreshold: number;
            lastUpdated: Date;
        };
    }>;
}

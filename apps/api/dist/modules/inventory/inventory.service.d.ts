import { PrismaService } from '../../config/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { RecordInwardDto, RecordOutwardDto, RecordWastageDto, RecordTransferDto } from './dto/record-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
            unitPrice: Prisma.Decimal | null;
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
            budget: Prisma.Decimal | null;
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
    }>;
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
            unitPrice: Prisma.Decimal | null;
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
            budget: Prisma.Decimal | null;
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
            unitPrice: Prisma.Decimal | null;
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
            budget: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
        quantityOnHand: Prisma.Decimal;
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
            unitPrice: Prisma.Decimal | null;
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
            budget: Prisma.Decimal | null;
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
    }>;
    recordInward(companyId: string, itemId: string, userId: string, dto: RecordInwardDto): Promise<{
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
                unitPrice: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
        };
    }>;
    recordOutward(companyId: string, itemId: string, userId: string, dto: RecordOutwardDto): Promise<{
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
                unitPrice: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
        };
    }>;
    recordWastage(companyId: string, itemId: string, userId: string, dto: RecordWastageDto): Promise<{
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
                unitPrice: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
        };
    }>;
    recordTransfer(companyId: string, itemId: string, userId: string, dto: RecordTransferDto): Promise<{
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
                unitPrice: Prisma.Decimal | null;
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
                budget: Prisma.Decimal | null;
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
        };
        destinationItem: {
            id: string;
            companyId: string;
            deletedAt: Date | null;
            siteId: string;
            materialId: string;
            quantityOnHand: Prisma.Decimal;
            lowStockThreshold: number;
            lastUpdated: Date;
        };
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
            unitPrice: Prisma.Decimal | null;
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
            budget: Prisma.Decimal | null;
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
}

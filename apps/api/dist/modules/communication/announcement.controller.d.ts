import { AnnouncementService } from './announcement.service';
import { AnnouncementReceiptService } from './announcement-receipt.service';
import { CreateAnnouncementDto, PublishAnnouncementDto, ArchiveAnnouncementDto } from './dto/create-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';
export declare class AnnouncementController {
    private readonly announcementService;
    private readonly receiptService;
    constructor(announcementService: AnnouncementService, receiptService: AnnouncementReceiptService);
    create(dto: CreateAnnouncementDto, companyId: string, userId: string): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        receipts: ({
            users: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string;
            acknowledgedAt: Date | null;
            readAt: Date | null;
            announcementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AnnouncementStatus;
        expiresAt: Date | null;
        title: string;
        publishedAt: Date | null;
        body: string;
        priority: string;
        targetRoles: import("@prisma/client/runtime/client").JsonValue;
        targetEmployees: import("@prisma/client/runtime/client").JsonValue;
    }>;
    publish(dto: PublishAnnouncementDto, companyId: string, userId: string): Promise<{
        success: boolean;
    }>;
    archive(dto: ArchiveAnnouncementDto, companyId: string, userId: string): Promise<{
        success: boolean;
    }>;
    markRead(id: string, companyId: string, userId: string): Promise<{
        success: boolean;
    }>;
    acknowledge(id: string, companyId: string, userId: string): Promise<{
        success: boolean;
    }>;
    list(companyId: string, query: QueryAnnouncementDto): Promise<{
        data: ({
            users: {
                id: string;
                firstName: string;
                lastName: string;
            };
            _count: {
                receipts: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            createdById: string;
            status: import(".prisma/client").$Enums.AnnouncementStatus;
            expiresAt: Date | null;
            title: string;
            publishedAt: Date | null;
            body: string;
            priority: string;
            targetRoles: import("@prisma/client/runtime/client").JsonValue;
            targetEmployees: import("@prisma/client/runtime/client").JsonValue;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    myAnnouncements(companyId: string, userId: string): Promise<({
        users: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AnnouncementStatus;
        expiresAt: Date | null;
        title: string;
        publishedAt: Date | null;
        body: string;
        priority: string;
        targetRoles: import("@prisma/client/runtime/client").JsonValue;
        targetEmployees: import("@prisma/client/runtime/client").JsonValue;
    })[]>;
    getOne(id: string, companyId: string): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        receipts: ({
            users: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string;
            acknowledgedAt: Date | null;
            readAt: Date | null;
            announcementId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        createdById: string;
        status: import(".prisma/client").$Enums.AnnouncementStatus;
        expiresAt: Date | null;
        title: string;
        publishedAt: Date | null;
        body: string;
        priority: string;
        targetRoles: import("@prisma/client/runtime/client").JsonValue;
        targetEmployees: import("@prisma/client/runtime/client").JsonValue;
    }>;
    getReceipts(id: string, companyId: string): Promise<{
        receipts: ({
            users: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            userId: string;
            acknowledgedAt: Date | null;
            readAt: Date | null;
            announcementId: string;
        })[];
        counts: {
            total: number;
            readCount: number;
            acknowledgedCount: number;
        };
    }>;
}

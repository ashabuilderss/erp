import { Prisma, AnnouncementStatus } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export interface CreateAnnouncementInput {
    companyId: string;
    title: string;
    body: string;
    priority?: string;
    targetRoles: string[];
    targetEmployees: string[];
    expiresAt?: Date;
    createdById: string;
}
export interface PublishAnnouncementInput {
    companyId: string;
    announcementId: string;
    userId: string;
}
export interface ArchiveAnnouncementInput {
    companyId: string;
    announcementId: string;
    userId: string;
}
export declare class AnnouncementService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly notificationsService;
    private readonly auditService;
    private readonly transitionService;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, notificationsService: NotificationsService, auditService: AuditService, transitionService: TransitionService);
    create(input: CreateAnnouncementInput): Promise<string>;
    publish(input: PublishAnnouncementInput): Promise<void>;
    archive(input: ArchiveAnnouncementInput): Promise<void>;
    getAnnouncement(id: string, companyId: string): Promise<{
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
        targetRoles: Prisma.JsonValue;
        targetEmployees: Prisma.JsonValue;
    }>;
    listAnnouncements(companyId: string, options: {
        page?: number;
        limit?: number;
        status?: AnnouncementStatus;
    }): Promise<{
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
            targetRoles: Prisma.JsonValue;
            targetEmployees: Prisma.JsonValue;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPublishedForEmployee(companyId: string, employeeId: string): Promise<({
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
        targetRoles: Prisma.JsonValue;
        targetEmployees: Prisma.JsonValue;
    })[]>;
    private sendPublishNotifications;
}

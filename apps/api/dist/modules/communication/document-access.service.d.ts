import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { DocumentAccessLogService } from '../audit/document-access-log.service';
export interface LogAccessInput {
    companyId: string;
    documentId: string;
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class DocumentAccessService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly accessLogService;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, accessLogService: DocumentAccessLogService);
    logAccess(input: LogAccessInput): Promise<string>;
    getAccessLogs(documentId: string, companyId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
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
            action: string;
            userId: string;
            ipAddress: string | null;
            userAgent: string | null;
            documentId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAccessStats(documentId: string, companyId: string): Promise<{
        totalAccesses: number;
        uniqueUserCount: number;
    }>;
}

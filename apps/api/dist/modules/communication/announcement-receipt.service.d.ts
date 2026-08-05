import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { AuditService } from '../audit/audit.service';
export interface MarkReadInput {
    companyId: string;
    announcementId: string;
    userId: string;
}
export interface AcknowledgeInput {
    companyId: string;
    announcementId: string;
    userId: string;
}
export declare class AnnouncementReceiptService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly auditService;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, auditService: AuditService);
    markRead(input: MarkReadInput): Promise<void>;
    acknowledge(input: AcknowledgeInput): Promise<void>;
    getReceipts(announcementId: string, companyId: string): Promise<({
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
    })[]>;
    getReceiptCounts(announcementId: string, companyId: string): Promise<{
        total: number;
        readCount: number;
        acknowledgedCount: number;
    }>;
}

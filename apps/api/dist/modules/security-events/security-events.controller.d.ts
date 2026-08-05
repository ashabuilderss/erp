import { SecurityEventsService } from './security-events.service';
import { QuerySecurityEventDto } from './dto/query-security-event.dto';
export declare class SecurityEventsController {
    private readonly securityEventsService;
    constructor(securityEventsService: SecurityEventsService);
    findAll(query: QuerySecurityEventDto, companyId: string): Promise<{
        data: {
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string | null;
            userId: string | null;
            ipAddress: string | null;
            eventType: string;
            userAgent: string | null;
            severity: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findLoginHistory(companyId: string): Promise<{
        data: {
            id: string;
            email: string;
            status: string;
            reason: string | null;
            createdAt: string;
        }[];
        meta: {
            total: number;
        };
    }>;
    findSessions(companyId: string): Promise<{
        id: string;
        email: string;
        createdAt: string;
    }[]>;
}

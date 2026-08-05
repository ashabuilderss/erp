import { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
export declare class ActivityLogsController {
    private readonly activityLogsService;
    constructor(activityLogsService: ActivityLogsService);
    findAll(query: QueryActivityLogDto, companyId: string): Promise<{
        data: ({
            employees: ({
                users: {
                    firstName: string;
                    lastName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                userId: string | null;
                teamId: string | null;
                departmentId: string;
                status: import(".prisma/client").$Enums.EmployeeStatus;
                employeeCode: string;
                designationId: string;
                phone: string | null;
                dateOfJoining: Date | null;
                salary: import("@prisma/client-runtime-utils").Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            }) | null;
        } & {
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string | null;
            action: string;
            entityType: string;
            entityId: string;
            performedById: string | null;
            beforeValues: import("@prisma/client/runtime/client").JsonValue | null;
            actorEmail: string | null;
            actorName: string | null;
            actorRole: string | null;
            ipAddress: string | null;
            requestId: string | null;
            afterValues: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    export(query: QueryActivityLogDto, companyId: string, res: Response): Promise<Response<any, Record<string, any>>>;
}

import { PrismaService } from '../../config/prisma.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { Prisma } from '@prisma/client';
export declare class ActivityLogsService {
    private prisma;
    constructor(prisma: PrismaService);
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
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            }) | null;
        } & {
            metadata: Prisma.JsonValue | null;
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string | null;
            action: string;
            entityType: string;
            entityId: string;
            performedById: string | null;
            beforeValues: Prisma.JsonValue | null;
            actorEmail: string | null;
            actorName: string | null;
            actorRole: string | null;
            ipAddress: string | null;
            requestId: string | null;
            afterValues: Prisma.JsonValue | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    exportAll(query: QueryActivityLogDto, companyId: string): Promise<({
        employees: ({
            users: {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                notificationPreferences: Prisma.JsonValue | null;
                companyId: string;
                backupCodes: Prisma.JsonValue | null;
                deletedAt: Date | null;
                hashedPassword: string | null;
                totpEnabled: boolean;
                totpSecret: string | null;
                totpVerifiedAt: Date | null;
                roleId: string | null;
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
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        }) | null;
    } & {
        metadata: Prisma.JsonValue | null;
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        action: string;
        entityType: string;
        entityId: string;
        performedById: string | null;
        beforeValues: Prisma.JsonValue | null;
        actorEmail: string | null;
        actorName: string | null;
        actorRole: string | null;
        ipAddress: string | null;
        requestId: string | null;
        afterValues: Prisma.JsonValue | null;
    })[]>;
}

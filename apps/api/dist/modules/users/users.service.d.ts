import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Prisma } from '@prisma/client';
export declare class UsersService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    findAll(query: QueryUserDto, companyId: string): Promise<{
        data: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            notificationPreferences: Prisma.JsonValue;
            employees: {
                id: string;
                departments: {
                    name: string;
                };
                employeeCode: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, companyId: string): Promise<{
        employees: ({
            departments: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
            };
            designations: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
                departmentId: string;
            };
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
    }>;
    update(id: string, dto: UpdateUserDto, companyId: string): Promise<{
        employees: {
            id: string;
            employeeCode: string;
        } | null;
    } & {
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
    }>;
    remove(id: string, companyId: string): Promise<{
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
    }>;
    updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<{
        notificationPreferences: Prisma.JsonValue;
    }>;
}

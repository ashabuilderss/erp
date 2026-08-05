import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserRole } from '@prisma/client';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
            notificationPreferences: import("@prisma/client/runtime/client").JsonValue;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
        notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
        companyId: string;
        backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
        deletedAt: Date | null;
        hashedPassword: string | null;
        totpEnabled: boolean;
        totpSecret: string | null;
        totpVerifiedAt: Date | null;
        roleId: string | null;
    }>;
    update(id: string, dto: UpdateUserDto, companyId: string, currentUserId: string, currentUserRole: UserRole): Promise<{
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
        notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
        companyId: string;
        backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
        deletedAt: Date | null;
        hashedPassword: string | null;
        totpEnabled: boolean;
        totpSecret: string | null;
        totpVerifiedAt: Date | null;
        roleId: string | null;
    }>;
    remove(id: string, companyId: string, currentUserId: string, currentUserRole: UserRole): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
        companyId: string;
        backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
        deletedAt: Date | null;
        hashedPassword: string | null;
        totpEnabled: boolean;
        totpSecret: string | null;
        totpVerifiedAt: Date | null;
        roleId: string | null;
    }>;
    updatePreferences(dto: UpdatePreferencesDto, userId: string): Promise<{
        notificationPreferences: import("@prisma/client/runtime/client").JsonValue;
    }>;
}

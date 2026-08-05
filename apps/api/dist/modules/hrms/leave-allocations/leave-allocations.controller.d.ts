import { LeaveAllocationsService } from './leave-allocations.service';
import { CreateLeaveAllocationDto } from './dto/create-leave-allocation.dto';
import { UpdateLeaveAllocationDto } from './dto/update-leave-allocation.dto';
import { QueryLeaveAllocationDto } from './dto/query-leave-allocation.dto';
export declare class LeaveAllocationsController {
    private readonly service;
    constructor(service: LeaveAllocationsService);
    create(dto: CreateLeaveAllocationDto, companyId: string): Promise<{
        employees: {
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
                notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                companyId: string;
                backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        year: number;
        employeeId: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
    }>;
    findAll(query: QueryLeaveAllocationDto, companyId: string): Promise<{
        data: ({
            employees: {
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
                    notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                    companyId: string;
                    backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
                    deletedAt: Date | null;
                    hashedPassword: string | null;
                    totpEnabled: boolean;
                    totpSecret: string | null;
                    totpVerifiedAt: Date | null;
                    roleId: string | null;
                } | null;
                departments: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    deletedAt: Date | null;
                    description: string | null;
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            year: number;
            employeeId: string;
            leaveType: import(".prisma/client").$Enums.LeaveType;
            totalDays: number;
            usedDays: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    myBalance(employeeId: string | null, companyId: string): Promise<{
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
        remainingDays: number;
    }[]>;
    employeeBalance(employeeId: string, companyId: string): Promise<{
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
        remainingDays: number;
    }[]>;
    findOne(id: string, companyId: string): Promise<{
        employees: {
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
                notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                companyId: string;
                backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
                deletedAt: Date | null;
                hashedPassword: string | null;
                totpEnabled: boolean;
                totpSecret: string | null;
                totpVerifiedAt: Date | null;
                roleId: string | null;
            } | null;
            departments: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                deletedAt: Date | null;
                description: string | null;
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        year: number;
        employeeId: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
    }>;
    update(id: string, dto: UpdateLeaveAllocationDto, companyId: string): Promise<{
        employees: {
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
                notificationPreferences: import("@prisma/client/runtime/client").JsonValue | null;
                companyId: string;
                backupCodes: import("@prisma/client/runtime/client").JsonValue | null;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        year: number;
        employeeId: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        year: number;
        employeeId: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        totalDays: number;
        usedDays: number;
    }>;
}

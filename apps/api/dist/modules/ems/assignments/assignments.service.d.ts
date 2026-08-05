import { PrismaService } from '../../../config/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Prisma } from '@prisma/client';
export declare class AssignmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateAssignmentDto, companyId: string): Promise<{
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
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        type: import(".prisma/client").$Enums.AssignmentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        entityId: string;
        employeeId: string;
        notes: string | null;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    findAll(query: QueryAssignmentDto, companyId: string): Promise<{
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
                salary: Prisma.Decimal | null;
                address: string | null;
                managerId: string | null;
                staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
            };
        } & {
            type: import(".prisma/client").$Enums.AssignmentType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            entityId: string;
            employeeId: string;
            notes: string | null;
            startDate: Date | null;
            endDate: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
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
            salary: Prisma.Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
    } & {
        type: import(".prisma/client").$Enums.AssignmentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        entityId: string;
        employeeId: string;
        notes: string | null;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    update(id: string, dto: UpdateAssignmentDto, companyId: string): Promise<{
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
        };
    } & {
        type: import(".prisma/client").$Enums.AssignmentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        entityId: string;
        employeeId: string;
        notes: string | null;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AssignmentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        entityId: string;
        employeeId: string;
        notes: string | null;
        startDate: Date | null;
        endDate: Date | null;
    }>;
    getAssignmentsByEmployee(employeeId: string, companyId: string): Promise<({
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
        };
    } & {
        type: import(".prisma/client").$Enums.AssignmentType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        entityId: string;
        employeeId: string;
        notes: string | null;
        startDate: Date | null;
        endDate: Date | null;
    })[]>;
    private validateEntity;
}

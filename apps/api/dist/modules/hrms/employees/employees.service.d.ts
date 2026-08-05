import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../config/prisma.service';
import { TransitionService } from '../../../common/services/transition.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { Prisma, UserRole } from '@prisma/client';
export declare class EmployeesService {
    private prisma;
    private eventEmitter;
    private transitionService;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, transitionService: TransitionService);
    getMyProfile(userId: string, role?: UserRole): Promise<{
        employees: ({
            users: {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
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
        users: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
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
        dateOfJoining: Date | null;
        managerId: string | null;
        staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
    }>;
    private DESIGNATION_PREFIXES;
    private generateEmployeeCode;
    create(dto: CreateEmployeeDto, companyId: string): Promise<{
        employees: {
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
        } | null;
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
    }>;
    findAll(query: QueryEmployeeDto, scopeFilter?: Record<string, any>, role?: string): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, companyId: string): Promise<any>;
    update(id: string, dto: UpdateEmployeeDto, companyId: string): Promise<{
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
    }>;
    invite(id: string, email: string, companyId: string): Promise<{
        success: boolean;
    }>;
    remove(id: string, companyId: string): Promise<{
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
    }>;
    revokeAccess(id: string, companyId: string): Promise<{
        success: boolean;
    }>;
    findByIdWithCompanySettings(employeeId: string, companyId: string): Promise<({
        companies: {
            settings: Prisma.JsonValue;
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
    }) | null>;
    findActiveForPayroll(companyId: string): Promise<{
        id: string;
        dateOfJoining: Date | null;
        salary: Prisma.Decimal | null;
    }[]>;
    countActive(companyId: string): Promise<number>;
    findActiveBasic(companyId: string, limit?: number): Promise<{
        id: string;
        users: {
            firstName: string;
            lastName: string;
        } | null;
        employeeCode: string;
    }[]>;
    findByUserId(userId: string, companyId?: string): Promise<{
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
    } | null>;
    findBasicById(employeeId: string): Promise<{
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
    } | null>;
    findBasicByIdAndCompany(employeeId: string, companyId: string): Promise<{
        id: string;
        userId: string | null;
    } | null>;
}

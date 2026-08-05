import { AuthService } from './auth.service';
import { CreateEmployeeWithUserDto } from './dto/create-employee-with-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    precheck(dto: LoginDto): Promise<{
        requiresTwoFactor: boolean;
        tempToken: string;
    } | {
        requiresTwoFactor: boolean;
    }>;
    login(dto: LoginDto, req: AuthenticatedRequest): Promise<{
        requiresTwoFactor: boolean;
        tempToken: string;
    } | {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            companyId: string;
            employeeId: string | null;
        };
    }>;
    private getIpAddress;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        success: boolean;
    }>;
    createEmployeeWithUser(dto: CreateEmployeeWithUserDto, req: AuthenticatedRequest): Promise<{
        user: {
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
        };
        employee: {
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
        };
    } | {
        user: {
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
        };
        employee: null;
    }>;
    getMe(req: AuthenticatedRequest): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            isActive: boolean;
            totpEnabled: boolean;
        };
        company: {
            id: string;
            name: string;
            slug: string;
        } | null;
        employee: {
            id: string;
            employeeCode: string;
        } | null;
        permissions: import("../../common/auth/permissions").Permission[];
    }>;
    changePassword(dto: ChangePasswordDto, req: AuthenticatedRequest): Promise<{
        success: boolean;
        message: string;
    }>;
}

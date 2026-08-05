import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { Prisma, UserRole } from '@prisma/client';
import { TwoFactorService } from './two-factor.service';
interface CreateEmployeeWithUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    employeeCode?: string;
    departmentId: string;
    designationId: string;
    phone?: string;
    dateOfJoining?: string;
    salary?: number;
    address?: string;
    role?: UserRole;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private eventEmitter;
    private logger;
    private twoFactorService;
    constructor(prisma: PrismaService, jwtService: JwtService, eventEmitter: EventEmitter2, logger: LoggerService, twoFactorService: TwoFactorService);
    getEffectivePermissions(userId: string, role: UserRole): Promise<import("../../common/auth/permissions").Permission[]>;
    precheck(email: string, password: string): Promise<{
        requiresTwoFactor: boolean;
        tempToken: string;
    } | {
        requiresTwoFactor: boolean;
    }>;
    login(email: string, password: string, ipAddress?: string): Promise<{
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
    refresh(refreshTokenStr: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    revokeRefreshToken(token: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    private createRefreshToken;
    private DESIGNATION_PREFIXES;
    private generateEmployeeCode;
    createEmployeeWithUser(dto: CreateEmployeeWithUserDto, companyId: string, requesterRole: UserRole): Promise<{
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
            notificationPreferences: Prisma.JsonValue | null;
            companyId: string;
            backupCodes: Prisma.JsonValue | null;
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
            notificationPreferences: Prisma.JsonValue | null;
            companyId: string;
            backupCodes: Prisma.JsonValue | null;
            deletedAt: Date | null;
            hashedPassword: string | null;
            totpEnabled: boolean;
            totpSecret: string | null;
            totpVerifiedAt: Date | null;
            roleId: string | null;
        };
        employee: null;
    }>;
    getEmployeeByUserId(userId: string): Promise<{
        id: string;
        employeeCode: string;
    } | null>;
    getFullUser(userId: string): Promise<{
        totpEnabled: boolean;
    } | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string, opts?: {
        totpToken?: string;
        ipAddress?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};

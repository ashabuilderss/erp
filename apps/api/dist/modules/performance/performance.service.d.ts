import { Prisma, PerformancePeriod } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { GovernanceEventPublisher } from '../governance-events/governance-event.publisher';
import { PerformanceEngine } from './performance.engine';
export interface CalculateScoreInput {
    companyId: string;
    employeeId: string;
    period: string;
    periodType: PerformancePeriod;
    calculatedById?: string;
}
export interface RateEmployeeInput {
    companyId: string;
    performanceScoreId: string;
    ratedById: string;
    score: number;
    comment?: string;
}
export interface GetTrendsInput {
    companyId: string;
    employeeId?: string;
    periodType?: PerformancePeriod;
    limit?: number;
}
export interface GetLeaderboardInput {
    companyId: string;
    period: string;
    periodType: PerformancePeriod;
    limit?: number;
}
export declare class PerformanceService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly engine;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, engine: PerformanceEngine);
    calculateScore(input: CalculateScoreInput): Promise<string>;
    rateEmployee(input: RateEmployeeInput): Promise<string>;
    getScore(id: string, companyId: string): Promise<{
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
        managerRatings: ({
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
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            score: number;
            comment: string | null;
            ratedAt: Date;
            performanceScoreId: string;
            ratedById: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        period: string;
        periodType: import(".prisma/client").$Enums.PerformancePeriod;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        compositeScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
        calculatedById: string | null;
        calculatedAt: Date;
    }>;
    getCurrentScore(companyId: string, employeeId: string, period: string, periodType: PerformancePeriod): Promise<({
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
        managerRatings: ({
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
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            score: number;
            comment: string | null;
            ratedAt: Date;
            performanceScoreId: string;
            ratedById: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        period: string;
        periodType: import(".prisma/client").$Enums.PerformancePeriod;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        compositeScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
        calculatedById: string | null;
        calculatedAt: Date;
    }) | null>;
    getEmployeeScores(companyId: string, employeeId: string, periodType?: PerformancePeriod): Promise<({
        managerRatings: {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            score: number;
            comment: string | null;
            ratedAt: Date;
            performanceScoreId: string;
            ratedById: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        period: string;
        periodType: import(".prisma/client").$Enums.PerformancePeriod;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        compositeScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
        calculatedById: string | null;
        calculatedAt: Date;
    })[]>;
    getHistoricalScores(companyId: string, employeeId: string, period: string, periodType: PerformancePeriod): Promise<({
        managerRatings: {
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            score: number;
            comment: string | null;
            ratedAt: Date;
            performanceScoreId: string;
            ratedById: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        period: string;
        periodType: import(".prisma/client").$Enums.PerformancePeriod;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        compositeScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
        calculatedById: string | null;
        calculatedAt: Date;
    })[]>;
    getTrends(input: GetTrendsInput): Promise<{
        id: string;
        companyId: string;
        deletedAt: Date | null;
        employeeId: string;
        projectionVersion: number;
        lastProcessedEventId: string | null;
        lastProcessedCorrelationId: string | null;
        lastProjectionUpdate: Date;
        period: string;
        periodType: import(".prisma/client").$Enums.PerformancePeriod;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        compositeScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
        previousCompositeScore: number | null;
        scoreDelta: number | null;
    }[]>;
    getLeaderboard(input: GetLeaderboardInput): Promise<{
        rank: number;
        employeeId: string;
        employeeName: string;
        department: string;
        designation: string;
        compositeScore: number;
        taskScore: number;
        attendanceScore: number;
        eodScore: number;
        managerScore: number;
        trend: import(".prisma/client").$Enums.TrendDirection;
    }[]>;
    recalculateScore(companyId: string, employeeId: string, period: string, periodType: PerformancePeriod, calculatedById?: string): Promise<string>;
    listScores(companyId: string, options: {
        page?: number;
        limit?: number;
        employeeId?: string;
        periodType?: PerformancePeriod;
        period?: string;
    }): Promise<{
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
            id: string;
            createdAt: Date;
            companyId: string;
            deletedAt: Date | null;
            employeeId: string;
            period: string;
            periodType: import(".prisma/client").$Enums.PerformancePeriod;
            taskScore: number;
            attendanceScore: number;
            eodScore: number;
            managerScore: number;
            compositeScore: number;
            trend: import(".prisma/client").$Enums.TrendDirection;
            calculatedById: string | null;
            calculatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    private computeTaskScore;
    private computeAttendanceScore;
    private computeEodScore;
    private getPreviousCompositeScore;
    private getPeriodRange;
    private getWorkingDaysInRange;
}

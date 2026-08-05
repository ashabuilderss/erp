import { AttendanceService } from './attendance.service';
import { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CheckInDto, CheckOutDto, PunchDto } from './dto/punch.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    findAll(companyId: string, query: QueryAttendanceDto): Promise<{
        data: ({
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
            status: import(".prisma/client").$Enums.DayAggregateStatus;
            employeeId: string;
            date: Date;
            totalWorkMinutes: number;
            totalBreakMinutes: number;
            firstPunchAt: Date | null;
            lastPunchAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTodayStats(companyId: string): Promise<{
        present: number;
        absent: number;
        onLeave: number;
        total: number;
    }>;
    getLast7Days(companyId: string): Promise<{
        days: {
            date: string;
            present: number;
            absent: number;
            onLeave: number;
        }[];
        employees: {
            id: string;
            users: {
                firstName: string;
                lastName: string;
            } | null;
            employeeCode: string;
        }[];
    }>;
    getMyAttendance(employeeId: string | null, companyId: string): Promise<{
        today: string;
        records: ({
            attendanceSessions: {
                id: string;
                companyId: string;
                deletedAt: Date | null;
                employeeId: string;
                totalBreakMinutes: number;
                dayAggregateId: string;
                shiftAssignmentSnapshotId: string | null;
                sessionStart: Date;
                sessionEnd: Date | null;
                totalWorkedMinutes: number;
                overtimeMinutes: number;
                firstPunchId: string | null;
                lastPunchId: string | null;
                sessionStatus: import(".prisma/client").$Enums.SessionStatus;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.DayAggregateStatus;
            employeeId: string;
            date: Date;
            totalWorkMinutes: number;
            totalBreakMinutes: number;
            firstPunchAt: Date | null;
            lastPunchAt: Date | null;
        })[];
    }>;
    getNonce(employeeId: string | null, companyId: string): Promise<{
        nonce: string;
    }>;
    findOne(companyId: string, id: string): Promise<({
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
            address: string | null;
            managerId: string | null;
            staffType: import(".prisma/client").$Enums.EmployeeStaffType | null;
        };
        attendanceSessions: {
            id: string;
            companyId: string;
            deletedAt: Date | null;
            employeeId: string;
            totalBreakMinutes: number;
            dayAggregateId: string;
            shiftAssignmentSnapshotId: string | null;
            sessionStart: Date;
            sessionEnd: Date | null;
            totalWorkedMinutes: number;
            overtimeMinutes: number;
            firstPunchId: string | null;
            lastPunchId: string | null;
            sessionStatus: import(".prisma/client").$Enums.SessionStatus;
        }[];
        attendanceAnomalies: {
            id: string;
            companyId: string;
            deletedAt: Date | null;
            employeeId: string;
            attendanceSessionId: string | null;
            attendanceDayAggregateId: string | null;
            attendanceCorrectionId: string | null;
            anomalyType: import(".prisma/client").$Enums.AnomalyType;
            severity: import(".prisma/client").$Enums.AnomalySeverity;
            detectedBy: string;
            detectedAt: Date;
            resolved: boolean;
            resolvedById: string | null;
            resolvedAt: Date | null;
            remarks: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.DayAggregateStatus;
        employeeId: string;
        date: Date;
        totalWorkMinutes: number;
        totalBreakMinutes: number;
        firstPunchAt: Date | null;
        lastPunchAt: Date | null;
    }) | null>;
    createManual(companyId: string, dto: CreateAttendanceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.DayAggregateStatus;
        employeeId: string;
        date: Date;
        totalWorkMinutes: number;
        totalBreakMinutes: number;
        firstPunchAt: Date | null;
        lastPunchAt: Date | null;
    }>;
    update(companyId: string, id: string, dto: UpdateAttendanceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.DayAggregateStatus;
        employeeId: string;
        date: Date;
        totalWorkMinutes: number;
        totalBreakMinutes: number;
        firstPunchAt: Date | null;
        lastPunchAt: Date | null;
    }>;
    remove(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.DayAggregateStatus;
        employeeId: string;
        date: Date;
        totalWorkMinutes: number;
        totalBreakMinutes: number;
        firstPunchAt: Date | null;
        lastPunchAt: Date | null;
    }>;
    checkIn(employeeId: string | null, companyId: string, body: CheckInDto, req: AuthenticatedRequest): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        timestamp: Date;
        employeeId: string;
        punchType: import(".prisma/client").$Enums.PunchType;
        deviceId: string | null;
        locationId: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        clientGeneratedUuid: string | null;
        payloadHash: string | null;
        locationMismatch: boolean;
    }>;
    checkOut(employeeId: string | null, companyId: string, body: CheckOutDto, req: AuthenticatedRequest): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        timestamp: Date;
        employeeId: string;
        punchType: import(".prisma/client").$Enums.PunchType;
        deviceId: string | null;
        locationId: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        clientGeneratedUuid: string | null;
        payloadHash: string | null;
        locationMismatch: boolean;
    }>;
    verify(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.DayAggregateStatus;
        employeeId: string;
        date: Date;
        totalWorkMinutes: number;
        totalBreakMinutes: number;
        firstPunchAt: Date | null;
        lastPunchAt: Date | null;
    }>;
    punch(body: PunchDto, employeeId: string | null, companyId: string, req: AuthenticatedRequest): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        deletedAt: Date | null;
        timestamp: Date;
        employeeId: string;
        punchType: import(".prisma/client").$Enums.PunchType;
        deviceId: string | null;
        locationId: string | null;
        latitude: import("@prisma/client-runtime-utils").Decimal | null;
        longitude: import("@prisma/client-runtime-utils").Decimal | null;
        clientGeneratedUuid: string | null;
        payloadHash: string | null;
        locationMismatch: boolean;
    }>;
}

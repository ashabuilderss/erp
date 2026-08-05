import { PrismaService } from '../../../config/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { QueryPayrollRunDto } from './dto/query-payroll-run.dto';
import { GovernanceEventPublisher } from '../../governance-events/governance-event.publisher';
import { EmployeesService } from '../employees/employees.service';
import { TransitionService } from '../../../common/services/transition.service';
export declare class PayrollService {
    private readonly prisma;
    private readonly eventPublisher;
    private readonly employeesService;
    private readonly transitionService;
    private readonly logger;
    constructor(prisma: PrismaService, eventPublisher: GovernanceEventPublisher, employeesService: EmployeesService, transitionService: TransitionService);
    createRun(dto: CreatePayrollRunDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        notes: string | null;
        processedAt: Date | null;
        employeeCount: number | null;
        totalNetPay: Prisma.Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: Prisma.Decimal | null;
        totalDeductions: Prisma.Decimal | null;
        processedById: string | null;
    }>;
    findAllRuns(query: QueryPayrollRunDto, companyId: string): Promise<{
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
            _count: {
                payslips: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.PayrollRunStatus;
            notes: string | null;
            processedAt: Date | null;
            employeeCount: number | null;
            totalNetPay: Prisma.Decimal | null;
            periodStart: Date;
            periodEnd: Date;
            totalEarnings: Prisma.Decimal | null;
            totalDeductions: Prisma.Decimal | null;
            processedById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOneRun(id: string, companyId: string): Promise<{
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
        payslips: ({
            employees: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: Prisma.Decimal;
            payrollRunId: string;
            basicSalary: Prisma.Decimal;
            earnings: Prisma.JsonValue;
            deductions: Prisma.JsonValue;
            grossPay: Prisma.Decimal;
            netPay: Prisma.Decimal;
            paidAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        notes: string | null;
        processedAt: Date | null;
        employeeCount: number | null;
        totalNetPay: Prisma.Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: Prisma.Decimal | null;
        totalDeductions: Prisma.Decimal | null;
        processedById: string | null;
    }>;
    processRun(id: string, processedById: string, companyId: string): Promise<{
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
        payslips: ({
            employees: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: Prisma.Decimal;
            payrollRunId: string;
            basicSalary: Prisma.Decimal;
            earnings: Prisma.JsonValue;
            deductions: Prisma.JsonValue;
            grossPay: Prisma.Decimal;
            netPay: Prisma.Decimal;
            paidAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        notes: string | null;
        processedAt: Date | null;
        employeeCount: number | null;
        totalNetPay: Prisma.Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: Prisma.Decimal | null;
        totalDeductions: Prisma.Decimal | null;
        processedById: string | null;
    }>;
    markPaid(id: string, companyId: string): Promise<{
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
        payslips: ({
            employees: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: Prisma.Decimal;
            payrollRunId: string;
            basicSalary: Prisma.Decimal;
            earnings: Prisma.JsonValue;
            deductions: Prisma.JsonValue;
            grossPay: Prisma.Decimal;
            netPay: Prisma.Decimal;
            paidAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        notes: string | null;
        processedAt: Date | null;
        employeeCount: number | null;
        totalNetPay: Prisma.Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: Prisma.Decimal | null;
        totalDeductions: Prisma.Decimal | null;
        processedById: string | null;
    }>;
    cancelRun(id: string, companyId: string): Promise<{
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
        payslips: ({
            employees: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: Prisma.Decimal;
            payrollRunId: string;
            basicSalary: Prisma.Decimal;
            earnings: Prisma.JsonValue;
            deductions: Prisma.JsonValue;
            grossPay: Prisma.Decimal;
            netPay: Prisma.Decimal;
            paidAt: Date | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        notes: string | null;
        processedAt: Date | null;
        employeeCount: number | null;
        totalNetPay: Prisma.Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: Prisma.Decimal | null;
        totalDeductions: Prisma.Decimal | null;
        processedById: string | null;
    }>;
    findMyPayslips(employeeId: string, companyId: string): Promise<({
        payrollRuns: {
            status: import(".prisma/client").$Enums.PayrollRunStatus;
            periodStart: Date;
            periodEnd: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayslipStatus;
        employeeId: string;
        notes: string | null;
        totalDeductions: Prisma.Decimal;
        payrollRunId: string;
        basicSalary: Prisma.Decimal;
        earnings: Prisma.JsonValue;
        deductions: Prisma.JsonValue;
        grossPay: Prisma.Decimal;
        netPay: Prisma.Decimal;
        paidAt: Date | null;
    })[]>;
    findOnePayslip(id: string, companyId: string): Promise<{
        employees: {
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
        };
        payrollRuns: {
            status: import(".prisma/client").$Enums.PayrollRunStatus;
            periodStart: Date;
            periodEnd: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.PayslipStatus;
        employeeId: string;
        notes: string | null;
        totalDeductions: Prisma.Decimal;
        payrollRunId: string;
        basicSalary: Prisma.Decimal;
        earnings: Prisma.JsonValue;
        deductions: Prisma.JsonValue;
        grossPay: Prisma.Decimal;
        netPay: Prisma.Decimal;
        paidAt: Date | null;
    }>;
}

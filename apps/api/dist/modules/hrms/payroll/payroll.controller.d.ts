import { PayrollService } from './payroll.service';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { QueryPayrollRunDto } from './dto/query-payroll-run.dto';
export declare class PayrollController {
    private readonly service;
    constructor(service: PayrollService);
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
        totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
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
                salary: import("@prisma/client-runtime-utils").Decimal | null;
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
            totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
            periodStart: Date;
            periodEnd: Date;
            totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
            totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: import("@prisma/client-runtime-utils").Decimal;
            payrollRunId: string;
            basicSalary: import("@prisma/client-runtime-utils").Decimal;
            earnings: import("@prisma/client/runtime/client").JsonValue;
            deductions: import("@prisma/client/runtime/client").JsonValue;
            grossPay: import("@prisma/client-runtime-utils").Decimal;
            netPay: import("@prisma/client-runtime-utils").Decimal;
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
        totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
        processedById: string | null;
    }>;
    processRun(id: string, employeeId: string | null, companyId: string): Promise<{
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: import("@prisma/client-runtime-utils").Decimal;
            payrollRunId: string;
            basicSalary: import("@prisma/client-runtime-utils").Decimal;
            earnings: import("@prisma/client/runtime/client").JsonValue;
            deductions: import("@prisma/client/runtime/client").JsonValue;
            grossPay: import("@prisma/client-runtime-utils").Decimal;
            netPay: import("@prisma/client-runtime-utils").Decimal;
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
        totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: import("@prisma/client-runtime-utils").Decimal;
            payrollRunId: string;
            basicSalary: import("@prisma/client-runtime-utils").Decimal;
            earnings: import("@prisma/client/runtime/client").JsonValue;
            deductions: import("@prisma/client/runtime/client").JsonValue;
            grossPay: import("@prisma/client-runtime-utils").Decimal;
            netPay: import("@prisma/client-runtime-utils").Decimal;
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
        totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
            status: import(".prisma/client").$Enums.PayslipStatus;
            employeeId: string;
            notes: string | null;
            totalDeductions: import("@prisma/client-runtime-utils").Decimal;
            payrollRunId: string;
            basicSalary: import("@prisma/client-runtime-utils").Decimal;
            earnings: import("@prisma/client/runtime/client").JsonValue;
            deductions: import("@prisma/client/runtime/client").JsonValue;
            grossPay: import("@prisma/client-runtime-utils").Decimal;
            netPay: import("@prisma/client-runtime-utils").Decimal;
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
        totalNetPay: import("@prisma/client-runtime-utils").Decimal | null;
        periodStart: Date;
        periodEnd: Date;
        totalEarnings: import("@prisma/client-runtime-utils").Decimal | null;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal | null;
        processedById: string | null;
    }>;
    findMyPayslips(employeeId: string | null, companyId: string): Promise<({
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
        totalDeductions: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string;
        basicSalary: import("@prisma/client-runtime-utils").Decimal;
        earnings: import("@prisma/client/runtime/client").JsonValue;
        deductions: import("@prisma/client/runtime/client").JsonValue;
        grossPay: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
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
            salary: import("@prisma/client-runtime-utils").Decimal | null;
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
        totalDeductions: import("@prisma/client-runtime-utils").Decimal;
        payrollRunId: string;
        basicSalary: import("@prisma/client-runtime-utils").Decimal;
        earnings: import("@prisma/client/runtime/client").JsonValue;
        deductions: import("@prisma/client/runtime/client").JsonValue;
        grossPay: import("@prisma/client-runtime-utils").Decimal;
        netPay: import("@prisma/client-runtime-utils").Decimal;
        paidAt: Date | null;
    }>;
}

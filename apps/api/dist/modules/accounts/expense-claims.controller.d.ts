import { ExpenseClaimsService } from './expense-claims.service';
import { CreateExpenseClaimDto, UpdateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { QueryExpenseClaimDto } from './dto/query-expense-claim.dto';
export declare class ExpenseClaimsController {
    private readonly service;
    constructor(service: ExpenseClaimsService);
    findAll(query: QueryExpenseClaimDto, companyId: string): Promise<({
        employeesExpenseClaimsApprovedByIdToemployees: {
            employeeCode: string;
        } | null;
        employeesExpenseClaimsEmployeeIdToemployees: {
            employeeCode: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.ExpenseStatus;
        employeeId: string;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        approvedAt: Date | null;
        approvedById: string | null;
        category: string;
        receiptUrl: string | null;
        expenseDate: Date;
    })[]>;
    findMy(employeeId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.ExpenseStatus;
        employeeId: string;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        approvedAt: Date | null;
        approvedById: string | null;
        category: string;
        receiptUrl: string | null;
        expenseDate: Date;
    }[]>;
    create(dto: CreateExpenseClaimDto, employeeId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.ExpenseStatus;
        employeeId: string;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        approvedAt: Date | null;
        approvedById: string | null;
        category: string;
        receiptUrl: string | null;
        expenseDate: Date;
    }>;
    approve(id: string, dto: UpdateExpenseClaimDto, currentEmployeeId: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string | null;
        status: import(".prisma/client").$Enums.ExpenseStatus;
        employeeId: string;
        notes: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        approvedAt: Date | null;
        approvedById: string | null;
        category: string;
        receiptUrl: string | null;
        expenseDate: Date;
    }>;
}

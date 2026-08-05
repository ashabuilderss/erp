import { PrismaService } from '../../config/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { QueryCommissionDto } from './dto/query-commission.dto';
import { CommissionStatus } from '@prisma/client';
export declare class CommissionService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCommissionDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CommissionStatus;
        employeeId: string;
        notes: string | null;
        leadId: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string | null;
        paidAt: Date | null;
        percentage: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    findAll(query: QueryCommissionDto, companyId: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.CommissionStatus;
            employeeId: string;
            notes: string | null;
            leadId: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            bookingId: string | null;
            paidAt: Date | null;
            percentage: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CommissionStatus;
        employeeId: string;
        notes: string | null;
        leadId: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string | null;
        paidAt: Date | null;
        percentage: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
    updateStatus(id: string, status: CommissionStatus, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        status: import(".prisma/client").$Enums.CommissionStatus;
        employeeId: string;
        notes: string | null;
        leadId: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        bookingId: string | null;
        paidAt: Date | null;
        percentage: import("@prisma/client-runtime-utils").Decimal | null;
    }>;
}

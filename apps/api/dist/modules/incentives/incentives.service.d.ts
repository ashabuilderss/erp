import { PrismaService } from '../../config/prisma.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';
import { UpdateIncentiveDto } from './dto/update-incentive.dto';
import { QueryIncentiveDto } from './dto/query-incentive.dto';
export declare class IncentivesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateIncentiveDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string;
        status: import(".prisma/client").$Enums.IncentiveStatus;
        value: import("@prisma/client-runtime-utils").Decimal | null;
        title: string;
        award: string;
        opportunityLabel: string | null;
        opportunityType: string | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
        winnerId: string | null;
    }>;
    findAll(companyId: string, query?: QueryIncentiveDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string;
            status: import(".prisma/client").$Enums.IncentiveStatus;
            value: import("@prisma/client-runtime-utils").Decimal | null;
            title: string;
            award: string;
            opportunityLabel: string | null;
            opportunityType: string | null;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
            winnerId: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findActive(companyId: string, query?: QueryIncentiveDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            deletedAt: Date | null;
            description: string;
            status: import(".prisma/client").$Enums.IncentiveStatus;
            value: import("@prisma/client-runtime-utils").Decimal | null;
            title: string;
            award: string;
            opportunityLabel: string | null;
            opportunityType: string | null;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
            winnerId: string | null;
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
        description: string;
        status: import(".prisma/client").$Enums.IncentiveStatus;
        value: import("@prisma/client-runtime-utils").Decimal | null;
        title: string;
        award: string;
        opportunityLabel: string | null;
        opportunityType: string | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
        winnerId: string | null;
    }>;
    update(id: string, dto: UpdateIncentiveDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string;
        status: import(".prisma/client").$Enums.IncentiveStatus;
        value: import("@prisma/client-runtime-utils").Decimal | null;
        title: string;
        award: string;
        opportunityLabel: string | null;
        opportunityType: string | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
        winnerId: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        deletedAt: Date | null;
        description: string;
        status: import(".prisma/client").$Enums.IncentiveStatus;
        value: import("@prisma/client-runtime-utils").Decimal | null;
        title: string;
        award: string;
        opportunityLabel: string | null;
        opportunityType: string | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
        winnerId: string | null;
    }>;
    leaderboard(companyId: string, employeeId?: string | null): Promise<{
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        incentivesWon: number;
        incentivesValue: number;
        commissionsPaid: number;
        commissionTotal: number;
        leadsAssigned: number;
        bookingsHandled: number;
        totalScore: number;
    }[]>;
}

import { PrismaService } from '../../../config/prisma.service';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { QueryChartOfAccountDto } from './dto/query-chart-of-account.dto';
export declare class ChartOfAccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateChartOfAccountDto, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AccountType;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string | null;
        code: string;
        parentId: string | null;
    }>;
    findAll(dto: QueryChartOfAccountDto, companyId: string): Promise<{
        items: ({
            parent: {
                name: string;
                id: string;
                code: string;
            } | null;
        } & {
            type: import(".prisma/client").$Enums.AccountType;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            description: string | null;
            code: string;
            parentId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string, companyId: string): Promise<{
        parent: {
            name: string;
            id: string;
            code: string;
        } | null;
        children: {
            type: import(".prisma/client").$Enums.AccountType;
            name: string;
            id: string;
            code: string;
        }[];
    } & {
        type: import(".prisma/client").$Enums.AccountType;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string | null;
        code: string;
        parentId: string | null;
    }>;
    update(id: string, dto: UpdateChartOfAccountDto, companyId: string): Promise<{
        type: import(".prisma/client").$Enums.AccountType;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string | null;
        code: string;
        parentId: string | null;
    }>;
    remove(id: string, companyId: string): Promise<{
        deleted: boolean;
    }>;
}

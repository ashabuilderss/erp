import { PrismaService } from '../../config/prisma.service';
import { CreateProjectBudgetDto, UpdateProjectBudgetDto, QueryProjectProfitabilityDto } from './dto/create-project-budget.dto';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
export declare class ProjectProfitabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(companyId: string, query: QueryProjectProfitabilityDto): Promise<{
        data: ({
            _count: {
                costEntries: number;
            };
            site: {
                name: string;
                id: string;
                status: import(".prisma/client").$Enums.SiteStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: string;
            siteId: string;
            budgetAmount: number;
            actualAmount: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId: string): Promise<{
        site: {
            name: string;
            id: string;
            status: import(".prisma/client").$Enums.SiteStatus;
        };
        costEntries: {
            id: string;
            companyId: string;
            description: string | null;
            amount: number;
            date: Date;
            category: string;
            budgetId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: string;
        siteId: string;
        budgetAmount: number;
        actualAmount: number;
    }>;
    create(dto: CreateProjectBudgetDto, companyId: string): Promise<{
        site: {
            name: string;
            id: string;
            status: import(".prisma/client").$Enums.SiteStatus;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: string;
        siteId: string;
        budgetAmount: number;
        actualAmount: number;
    }>;
    update(id: string, dto: UpdateProjectBudgetDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: string;
        siteId: string;
        budgetAmount: number;
        actualAmount: number;
    }>;
    listCostEntries(id: string, companyId: string): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        amount: number;
        date: Date;
        category: string;
        budgetId: string;
    }[]>;
    addCostEntry(budgetId: string, dto: CreateCostEntryDto, companyId: string): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        amount: number;
        date: Date;
        category: string;
        budgetId: string;
    }>;
    deleteCostEntry(entryId: string, companyId: string): Promise<{
        deleted: boolean;
    }>;
    getSummary(companyId: string): Promise<{
        totalBudget: number;
        totalActual: number;
        totalVariance: number;
        profitMarginPercent: number;
        projects: {
            siteId: string;
            siteName: string;
            budgetAmount: number;
            actualAmount: number;
            variance: number;
            status: string;
        }[];
    }>;
}

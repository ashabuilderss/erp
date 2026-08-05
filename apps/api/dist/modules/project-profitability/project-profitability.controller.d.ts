import { ProjectProfitabilityService } from './project-profitability.service';
import { CreateProjectBudgetDto, UpdateProjectBudgetDto, QueryProjectProfitabilityDto } from './dto/create-project-budget.dto';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
export declare class ProjectProfitabilityController {
    private readonly profitabilityService;
    constructor(profitabilityService: ProjectProfitabilityService);
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
    create(companyId: string, dto: CreateProjectBudgetDto): Promise<{
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
    findOne(companyId: string, id: string): Promise<{
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
    update(companyId: string, id: string, dto: UpdateProjectBudgetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: string;
        siteId: string;
        budgetAmount: number;
        actualAmount: number;
    }>;
    listCostEntries(companyId: string, id: string): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        amount: number;
        date: Date;
        category: string;
        budgetId: string;
    }[]>;
    addCostEntry(companyId: string, id: string, dto: CreateCostEntryDto): Promise<{
        id: string;
        companyId: string;
        description: string | null;
        amount: number;
        date: Date;
        category: string;
        budgetId: string;
    }>;
    deleteCostEntry(companyId: string, entryId: string): Promise<{
        deleted: boolean;
    }>;
}

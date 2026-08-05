export declare class QueryProjectProfitabilityDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}
export declare class CreateProjectBudgetDto {
    siteId: string;
    budgetAmount: number;
}
export declare class UpdateProjectBudgetDto {
    budgetAmount?: number;
    status?: string;
}

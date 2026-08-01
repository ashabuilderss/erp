export interface ProjectBudget {
  id: string;
  siteId: string;
  companyId: string;
  budgetAmount: number;
  actualAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  site?: { id: string; name: string };
  costEntries?: ProjectCostEntry[];
}

export interface ProjectCostEntry {
  id: string;
  budgetId: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
}

export interface CreateProjectBudgetDto {
  siteId: string;
  budgetAmount: number;
}

export interface UpdateProjectBudgetDto {
  budgetAmount?: number;
  status?: string;
}

export interface CreateCostEntryDto {
  category: string;
  amount: number;
  description?: string;
  date?: string;
}

export interface ProfitabilitySummary {
  totalBudget: number;
  totalActual: number;
  variance: number;
  siteCount: number;
  overBudgetCount: number;
}

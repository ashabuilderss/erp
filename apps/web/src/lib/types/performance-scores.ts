export type TrendDirection = "IMPROVING" | "STABLE" | "DECLINING";

export type PerformancePeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface PerformanceScore {
  id: string;
  companyId: string;
  employeeId: string;
  period: string;
  periodType: PerformancePeriod;
  taskScore: number;
  attendanceScore: number;
  eodScore: number;
  managerScore: number;
  compositeScore: number;
  trend: TrendDirection;
  calculatedAt: string;
  calculatedById: string | null;
  employees?: {
    id: string;
    users: { id: string; firstName: string; lastName: string };
    departments: { id: string; name: string } | null;
  };
  managerRatings?: ManagerRating[];
}

export interface ManagerRating {
  id: string;
  performanceScoreId: string;
  ratedById: string;
  score: number;
  comment: string | null;
  createdAt: string;
  employees?: {
    users: { id: string; firstName: string; lastName: string };
  };
}

export interface PerformanceTrendSnapshot {
  id: string;
  companyId: string;
  employeeId: string;
  periodType: PerformancePeriod;
  period: string;
  compositeScore: number;
  trend: TrendDirection;
  taskScore: number;
  attendanceScore: number;
  eodScore: number;
  managerScore: number;
  previousCompositeScore: number | null;
  scoreDelta: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  compositeScore: number;
  taskScore: number;
  attendanceScore: number;
  eodScore: number;
  managerScore: number;
  trend: TrendDirection;
}

export interface QueryPerformanceScoresDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  periodType?: PerformancePeriod;
  period?: string;
}

export interface CalculateScoreDto {
  employeeId: string;
  period: string;
  periodType: PerformancePeriod;
  calculatedById?: string;
}

export interface RateEmployeeDto {
  performanceScoreId: string;
  ratedById: string;
  score: number;
  comment?: string;
}

export interface GetTrendsDto {
  employeeId?: string;
  periodType?: PerformancePeriod;
  limit?: number;
}

export interface GetLeaderboardDto {
  period: string;
  periodType: PerformancePeriod;
  limit?: number;
}

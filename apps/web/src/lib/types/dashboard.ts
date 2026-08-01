export interface DashboardMetricsSnapshot {
  companyId: string;
  snapshotDate: string;
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  lateEmployees: number;
  pendingApprovals: number;
  overdueTasks: number;
  activeWarnings: number;
  activePayrollHolds: number;
}

export interface DashboardKpiSnapshot {
  id: string | null;
  companyId: string;
  snapshotDate: string;
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  lateEmployees: number;
  onLeaveToday: number;
  overdueTasks: number;
  activeWarnings: number;
  activePayrollHolds: number;
  pendingApprovals: number;
  collectionStatus: number;
  siteDelays: number;
  materialAlerts: number;
  criticalAlerts: number;
  avgPerformanceScore: number;
  topPerformers: Array<{
    employeeId: string;
    compositeScore: number;
    period: string;
  }>;
  totalProperties: number;
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalSiteVisits: number;
  totalBookings: number;
  totalRevenue: number;
  projectionVersion: number;
  lastProcessedEventId: string | null;
  lastProcessedCorrelationId: string | null;
  rebuiltAt: string | null;
  lastProjectionUpdate: string | null;
}

export interface DashboardAlert {
  id: string;
  companyId: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface ReplayEventResponse {
  success: boolean;
  message: string;
}

export interface ReplayHandlerResponse {
  success: boolean;
  message: string;
}

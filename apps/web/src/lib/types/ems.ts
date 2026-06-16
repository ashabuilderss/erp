import type { Employee } from "./hrms";
import type { LeaveRequest } from "./hrms";

export type AssignmentType = "PROPERTY" | "LEAD" | "SITE_VISIT" | "BOOKING";

export interface Assignment {
  id: string;
  employeeId: string;
  type: AssignmentType;
  entityId: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface QueryAssignmentDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  type?: AssignmentType;
  entityId?: string;
  startDateFrom?: string;
  endDateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateAssignmentDto {
  type: AssignmentType;
  employeeId: string;
  entityId: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export type UpdateAssignmentDto = Partial<CreateAssignmentDto>;

export interface Performance {
  id: string;
  employeeId: string;
  year: number;
  quarter: number;
  score: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface QueryPerformanceDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  year?: number;
  quarter?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreatePerformanceDto {
  employeeId: string;
  year: number;
  quarter: number;
  score: number;
  notes?: string;
}

export type UpdatePerformanceDto = Partial<CreatePerformanceDto>;

export interface AnalyticsDashboard {
  crm: {
    totalProperties: number;
    propertiesByStatus: { status: string; count: number }[];
    totalLeads: number;
    leadsByStatus: { status: string; count: number }[];
    totalCustomers: number;
    totalSiteVisits: number;
    siteVisitsByStatus: { status: string; count: number }[];
    totalBookings: number;
    bookingsByStatus: { status: string; count: number }[];
  };
  hrms: {
    totalEmployees: number;
    activeEmployees: number;
    attendanceRate: number;
    pendingLeaves: number;
    attendanceTrend: { date: string; present: number; absent: number; onLeave: number }[];
    departmentDistribution: { name: string; value: number }[];
  };
  ems: {
    totalAssignments: number;
    assignmentsByType: { type: AssignmentType; count: number }[];
    avgPerformanceScore: number;
    topPerformers: Performance[];
  };
}

export interface EmployeeAnalytics {
  employee: Employee;
  assignments: Assignment[];
  performance: Performance[];
  attendance: { totalDays: number; presentDays: number; attendanceRate: number };
  leaves: LeaveRequest[];
  metrics: {
    propertiesAssigned: number;
    leadsAssigned: number;
    siteVisitsCompleted: number;
    bookingsClosed: number;
    attendanceRate: number;
    conversionRate: number;
  };
}

export interface TeamAnalytics {
  totalEmployees: number;
  totalAssignments: number;
  avgPerformanceScore: number;
  attendanceRate: number;
  pendingLeaves: number;
  employees: {
    id: string;
    name: string;
    department: string | null;
    assignments: number;
    avgScore: number;
  }[];
}

export interface ConversionFunnel {
  leads: number;
  siteVisits: number;
  bookings: number;
  convertedLeads: number;
  leadToVisitRate: number;
  visitToBookingRate: number;
  leadToBookingRate: number;
}

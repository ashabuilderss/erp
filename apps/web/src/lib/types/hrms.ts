import type { UserRole } from "./common";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
export type LeaveType = "SICK" | "CASUAL" | "ANNUAL" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  departmentId: string;
  designationId: string;
  phone: string | null;
  dateOfJoining: string | null;
  salary: number | null;
  address: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  department?: Department;
  designation?: Designation;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  designations?: Designation[];
  _count?: { employees: number };
}

export interface Designation {
  id: string;
  name: string;
  departmentId: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  _count?: { employees: number };
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  verified: boolean;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  verifiedBy?: Employee;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string | null;
  status: LeaveStatus;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  approvedBy?: Employee;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  companyId: string;
  year: number;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface LeaveAllocationBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface QueryDepartmentDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
}

export type UpdateDepartmentDto = Partial<CreateDepartmentDto>;

export interface QueryDesignationDto {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateDesignationDto {
  name: string;
  departmentId: string;
  description?: string;
}

export type UpdateDesignationDto = Partial<CreateDesignationDto>;

export interface QueryEmployeeDto {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: EmployeeStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateEmployeeDto {
  employeeCode: string;
  userId: string;
  departmentId: string;
  designationId: string;
  phone?: string;
  dateOfJoining?: string;
  salary?: number;
  address?: string;
  status?: EmployeeStatus;
}

export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

export interface QueryAttendanceDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: AttendanceStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateAttendanceDto {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
}

export type UpdateAttendanceDto = Partial<CreateAttendanceDto>;

export interface QueryLeaveRequestDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  startDateFrom?: string;
  endDateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateLeaveRequestDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason?: string;
}

export type UpdateLeaveRequestDto = Partial<CreateLeaveRequestDto>;

export interface ApproveLeaveRequestDto {
  status: LeaveStatus;
  reason?: string;
}

export type CreateLeaveAllocationDto = {
  employeeId: string;
  year: number;
  leaveType: string;
  totalDays: number;
};

export type UpdateLeaveAllocationDto = Partial<CreateLeaveAllocationDto>;

export type QueryLeaveAllocationDto = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  leaveType?: string;
  year?: number;
  employeeId?: string;
};

export interface CheckInResponse {
  message: string;
  attendance: Attendance;
}

export interface CheckOutResponse {
  message: string;
  attendance: Attendance;
}

import type { UserRole } from "./common";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
export type LeaveType = "SICK" | "CASUAL" | "ANNUAL" | "OTHER" | "MEDICAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";
export type EmployeeStaffType = "OFFICE" | "FIELD" | "HYBRID";

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
  staffType?: EmployeeStaffType;
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
  companyId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  verified: boolean;
  verifiedById: string | null;
  verifiedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
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
  employeeCode?: string;
  userId?: string;
  departmentId: string;
  designationId: string;
  phone?: string;
  dateOfJoining?: string;
  salary?: number;
  address?: string;
  status?: EmployeeStatus;
  staffType?: EmployeeStaffType;
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
  documentUrl?: string;
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

export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DeviceRegistration {
  id: string;
  employeeId: string;
  companyId: string;
  deviceName: string;
  deviceId: string;
  isTrusted: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface CreateDeviceRegistrationDto {
  deviceName: string;
  deviceId: string;
  isTrusted?: boolean;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  companyId: string;
  attendanceId: string | null;
  date: string;
  reason: string;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  requestedStatus: AttendanceStatus | null;
  status: CorrectionStatus;
  approvedById: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  approvedBy?: Employee;
}

export interface CreateAttendanceCorrectionDto {
  attendanceId?: string;
  date: string;
  reason: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  requestedStatus?: AttendanceStatus;
}

export interface QueryAttendanceCorrectionDto {
  page?: number;
  limit?: number;
  status?: CorrectionStatus;
  employeeId?: string;
}

export type PayrollRunStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "PAID" | "CANCELLED";
export type PayslipStatus = "DRAFT" | "APPROVED" | "PAID";

export interface PayrollRun {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  totalEarnings: number | null;
  totalDeductions: number | null;
  totalNetPay: number | null;
  employeeCount: number | null;
  processedById: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  processedBy?: Employee;
  payslips?: Payslip[];
  _count?: { payslips: number };
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  companyId: string;
  basicSalary: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  payrollRun?: { periodStart: string; periodEnd: string; status: PayrollRunStatus };
}

export interface CreatePayrollRunDto {
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

export interface QueryPayrollRunDto {
  page?: number;
  limit?: number;
  status?: PayrollRunStatus;
}

// --- Construction ERP ---
export type SiteStatus = "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
export type SitePhaseStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type LabourType = "SKILLED" | "UNSKILLED" | "SUPERVISOR";
export type VendorStatus = "ACTIVE" | "INACTIVE";

export interface ConstructionSite {
  id: string;
  companyId: string;
  name: string;
  location: string;
  status: SiteStatus;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  phases?: SitePhase[];
  progressPhotos?: ProgressPhoto[];
  _count?: { phases: number; labourEntries: number; progressPhotos: number };
}

export interface SitePhase {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: SitePhaseStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  companyId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  companyId: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialInward {
  id: string;
  companyId: string;
  vendorId: string;
  siteId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  receivedDate: string;
  notes: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { name: string };
  site?: { name: string };
  material?: { name: string; unit: string };
}

export interface InventoryItem {
  id: string;
  companyId: string;
  siteId: string;
  materialId: string;
  quantityOnHand: number;
  lastUpdated: string;
  site?: { name: string };
  material?: { name: string; unit: string; category: string };
}

export interface LabourEntry {
  id: string;
  companyId: string;
  siteId: string;
  labourName: string;
  labourType: LabourType;
  date: string;
  hoursWorked: number | null;
  wagesAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  site?: { name: string };
}

export interface ProgressPhoto {
  id: string;
  companyId: string;
  siteId: string;
  phaseId: string | null;
  photoUrl: string;
  caption: string | null;
  takenAt: string;
  createdAt: string;
  updatedAt: string;
  phase?: { name: string };
}

export interface CreateSiteDto {
  name: string; location: string; status?: SiteStatus;
  startDate?: string; endDate?: string; budget?: number; description?: string;
}
export interface CreateVendorDto {
  name: string; contactPerson?: string; phone?: string; email?: string;
  address?: string; gstin?: string; status?: VendorStatus;
}
export interface CreateMaterialDto { name: string; category: string; unit: string; unitPrice?: number; }
export interface CreateMaterialInwardDto {
  vendorId: string; siteId: string; materialId: string;
  quantity: number; unitPrice: number; receivedDate: string; notes?: string;
}
export interface CreateLabourEntryDto {
  siteId: string; labourName: string; labourType: LabourType;
  date: string; hoursWorked?: number; wagesAmount: number; notes?: string;
}
export interface CreateProgressPhotoDto {
  siteId: string; photoUrl: string; phaseId?: string; caption?: string; takenAt?: string;
}

// --- Portal ---
export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Broker {
  id: string; companyId: string; name: string; companyName: string | null;
  phone: string | null; email: string | null; commissionRate: number | null;
  isActive: boolean; lastLoginAt: string | null; createdAt: string; updatedAt: string;
  _count?: { leads: number };
}

export interface Complaint {
  id: string; companyId: string; customerId: string; propertyId: string | null;
  subject: string; description: string; status: ComplaintStatus;
  resolution: string | null; resolvedAt: string | null;
  createdAt: string; updatedAt: string;
  customer?: { id: string; name: string; email?: string; phone?: string };
  property?: { id: string; title: string };
}

export interface CreateBrokerDto {
  name: string; companyName?: string; phone?: string; email?: string; commissionRate?: number;
}
export interface CreateComplaintDto {
  customerId: string; propertyId?: string; subject: string; description: string;
}

export interface Dealer {
  id: string; companyId: string; companyName: string;
  contactPerson: string | null; phone: string | null; email: string | null;
  gstin: string | null; address: string | null;
  isActive: boolean; lastLoginAt: string | null;
  createdAt: string; updatedAt: string;
}

export interface CreateDealerDto {
  companyName: string; contactPerson?: string; phone?: string;
  email?: string; gstin?: string; address?: string;
}

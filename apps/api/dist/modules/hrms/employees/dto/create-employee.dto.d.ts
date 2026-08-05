import { EmployeeStatus, EmployeeStaffType } from '@prisma/client';
export declare class CreateEmployeeDto {
    employeeCode?: string;
    userId?: string;
    departmentId: string;
    designationId: string;
    managerId?: string;
    phone?: string;
    dateOfJoining?: string;
    salary?: number;
    address?: string;
    status?: EmployeeStatus;
    staffType?: EmployeeStaffType;
    inviteToLogin?: boolean;
}

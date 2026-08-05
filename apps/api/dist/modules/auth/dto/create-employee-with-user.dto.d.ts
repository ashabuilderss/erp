import { UserRole } from '@prisma/client';
export declare class CreateEmployeeWithUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    employeeCode?: string;
    departmentId: string;
    designationId: string;
    phone?: string;
    dateOfJoining?: string;
    salary?: number;
    address?: string;
    role?: UserRole;
}

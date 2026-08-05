import { AssignmentType } from './create-assignment.dto';
export declare class QueryAssignmentDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    type?: AssignmentType;
    entityId?: string;
    startDateFrom?: string;
    endDateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

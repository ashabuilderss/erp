export declare class QueryAttendanceDto {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

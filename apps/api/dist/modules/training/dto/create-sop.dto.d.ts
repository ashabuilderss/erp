export declare class CreateSopDto {
    title: string;
    content?: string;
    fileUrl?: string;
    departmentId?: string;
}
export declare class UpdateSopDto {
    title?: string;
    content?: string;
    fileUrl?: string;
    departmentId?: string;
    isActive?: boolean;
}
export declare class AcknowledgeSopDto {
    employeeId?: string;
}
export declare class QuerySopDto {
    departmentId?: string;
    isActive?: string;
    search?: string;
    page?: number;
    limit?: number;
}

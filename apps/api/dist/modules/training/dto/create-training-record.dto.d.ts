export declare class CreateTrainingRecordDto {
    employeeId: string;
    sopDocumentId: string;
    completedAt?: string;
    score?: number;
}
export declare class QueryTrainingRecordDto {
    employeeId?: string;
    sopDocumentId?: string;
    page?: number;
    limit?: number;
}

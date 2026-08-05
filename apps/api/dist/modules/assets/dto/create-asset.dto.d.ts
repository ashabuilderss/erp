export declare class CreateAssetDto {
    name: string;
    category?: string;
    serialNumber?: string;
    qrCode?: string;
    purchaseDate?: string;
    purchaseCost?: number;
}
export declare class UpdateAssetDto {
    name?: string;
    category?: string;
    serialNumber?: string;
    qrCode?: string;
    purchaseDate?: string;
    purchaseCost?: number;
}
export declare class CreateAssignmentDto {
    employeeId: string;
    condition?: string;
}
export declare class CreateRepairDto {
    description: string;
    cost?: number;
    startDate?: string;
}
export declare class UpdateRepairDto {
    description?: string;
    cost?: number;
    endDate?: string;
    status?: string;
}
export declare class QueryAssetDto {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}

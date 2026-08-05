export declare class CreateExportConfigDto {
    exportType: string;
    sheetId?: string;
    sheetName?: string;
    syncEnabled?: boolean;
    syncSchedule?: string;
    allowedRoles: string[];
    grantedUsers?: string[];
}
export declare class UpdateExportConfigDto {
    sheetId?: string;
    sheetName?: string;
    syncEnabled?: boolean;
    syncSchedule?: string;
    allowedRoles?: string[];
    grantedUsers?: string[];
}

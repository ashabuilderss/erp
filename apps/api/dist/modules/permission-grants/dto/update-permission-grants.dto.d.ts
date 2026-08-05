declare class PermissionGrantEntry {
    permission: string;
    granted: boolean;
}
export declare class UpdatePermissionGrantsDto {
    grants: PermissionGrantEntry[];
}
export {};

export declare enum DataScope {
    ALL = "ALL",
    TEAM = "TEAM",
    OWN = "OWN"
}
export declare function getDataScope(role: string): DataScope;
export declare function isOwnDataScope(role: string): boolean;
export declare function getScopedEmployeeId(role: string, employeeId?: string | null): string | undefined;

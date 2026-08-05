export interface ScopeFilterUserContext {
    companyId: string;
    employeeId?: string | null;
    teamId?: string | null;
    departmentId?: string | null;
}
export interface ScopeFilterOptions {
    ownerField?: string;
    employeeRelation?: string;
}
export declare function getEffectiveScopeFilter(scopes: Record<string, string> | undefined, permissionName: string, user: ScopeFilterUserContext, options?: ScopeFilterOptions): Record<string, any>;
export declare function getDirectScopeFilter(scopes: Record<string, string> | undefined, permissionName: string, user: ScopeFilterUserContext, ownerField?: string): Record<string, any>;

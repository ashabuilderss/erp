import { PermissionScope } from '@prisma/client';
export interface ScopeUserContext {
    id: string;
    companyId: string;
    employeeId?: string | null;
    teamId?: string | null;
    departmentId?: string | null;
}
export interface ScopeFilterOptions {
    ownerField?: string;
    employeeRelation?: string;
}
export declare class ScopeService {
    generateFilter(scope: PermissionScope, user: ScopeUserContext, ownerField?: string): Record<string, any>;
    buildEffectiveFilter(scope: PermissionScope, user: ScopeUserContext, options?: ScopeFilterOptions): Record<string, any>;
}

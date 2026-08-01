import { Injectable } from '@nestjs/common';
import { PermissionScope } from '@prisma/client';

export interface ScopeUserContext {
  id: string;
  companyId: string;
  employeeId?: string | null;
  teamId?: string | null;
  departmentId?: string | null;
}

export interface ScopeFilterOptions {
  /** The Prisma field used for OWN-scoped filters (e.g. 'assignedToEmployeeId'). Defaults to 'createdById'. */
  ownerField?: string;
  /** The Prisma relation name for employee lookups (e.g. 'employees'), needed for TEAM/DEPARTMENT scoping on entities with assignedToEmployeeId. */
  employeeRelation?: string;
}

@Injectable()
export class ScopeService {
  /**
   * Generates a Prisma where filter based on the granted scope.
   */
  generateFilter(
    scope: PermissionScope,
    user: ScopeUserContext,
    ownerField: string = 'createdById',
  ): Record<string, any> {
    switch (scope) {
      case PermissionScope.OWN:
        return { [ownerField]: user.id, companyId: user.companyId };

      case PermissionScope.TEAM:
        if (!user.teamId) {
          return { [ownerField]: user.id, companyId: user.companyId };
        }
        return { teamId: user.teamId, companyId: user.companyId };

      case PermissionScope.DEPARTMENT:
        if (!user.departmentId) {
          return { [ownerField]: user.id, companyId: user.companyId };
        }
        return { departmentId: user.departmentId, companyId: user.companyId };

      case PermissionScope.COMPANY:
      case PermissionScope.OWNER_ONLY:
        return { companyId: user.companyId };

      default:
        return { [ownerField]: user.id, companyId: user.companyId };
    }
  }

  /**
   * Builds a scope filter aware of employeeId, teamId, and departmentId.
   *
   * For OWN scope: filters by employeeId via the ownerField (e.g. assignedToEmployeeId).
   * For TEAM/DEPARTMENT scope on entities linked to employees (leads, bookings, etc.):
   *   filters through the employee relation (e.g. { employees: { teamId } }).
   * For models that directly hold teamId/departmentId (Employee, etc.):
   *   use generateFilter() instead.
   */
  buildEffectiveFilter(
    scope: PermissionScope,
    user: ScopeUserContext,
    options: ScopeFilterOptions = {},
  ): Record<string, any> {
    const { ownerField = 'assignedToEmployeeId', employeeRelation = 'employees' } = options;
    const base: Record<string, any> = { companyId: user.companyId };

    switch (scope) {
      case PermissionScope.OWN:
        if (user.employeeId) {
          return { ...base, [ownerField]: user.employeeId };
        }
        return base;

      case PermissionScope.TEAM:
        if (!user.teamId) {
          if (user.employeeId) return { ...base, [ownerField]: user.employeeId };
          return base;
        }
        return { ...base, [employeeRelation]: { teamId: user.teamId } };

      case PermissionScope.DEPARTMENT:
        if (!user.departmentId) {
          if (user.employeeId) return { ...base, [ownerField]: user.employeeId };
          return base;
        }
        return { ...base, [employeeRelation]: { departmentId: user.departmentId } };

      case PermissionScope.COMPANY:
      case PermissionScope.OWNER_ONLY:
        return base;

      default:
        if (user.employeeId) return { ...base, [ownerField]: user.employeeId };
        return base;
    }
  }
}

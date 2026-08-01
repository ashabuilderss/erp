/**
 * Scope helper utilities for permission-based data access control.
 *
 * Bridges the resolved scopes from PermissionsGuard (attached as `request.user.scopes`)
 * with Prisma where filters for entity-level data scoping.
 *
 * Usage in a controller:
 * ```
 * const scopeFilter = getEffectiveScopeFilter(request.user.scopes, Permissions.LEAD_READ, {
 *   companyId,
 *   employeeId,
 *   teamId,
 *   departmentId,
 * }, { ownerField: 'assignedToEmployeeId', employeeRelation: 'employees' });
 * ```
 */

import { PermissionScope } from '@prisma/client';

export interface ScopeFilterUserContext {
  companyId: string;
  employeeId?: string | null;
  teamId?: string | null;
  departmentId?: string | null;
}

export interface ScopeFilterOptions {
  /** The Prisma field for OWN-scoped filters. Defaults to 'assignedToEmployeeId'. */
  ownerField?: string;
  /** The Prisma relation name to scope through for TEAM/DEPARTMENT scoping on
   *  entities that link to employees (e.g. leads, bookings). Defaults to 'employees'. */
  employeeRelation?: string;
}

/**
 * Builds a Prisma where filter from a resolved permission scope.
 *
 * @param scopes - The scopes map from PermissionsGuard (`request.user.scopes`).
 * @param permissionName - The permission key to look up (e.g. `Permissions.LEAD_READ`).
 * @param user - User context with companyId, employeeId, teamId, departmentId.
 * @param options - Optional field overrides.
 * @returns A Prisma where object to merge into queries. Always includes `companyId`.
 */
export function getEffectiveScopeFilter(
  scopes: Record<string, string> | undefined,
  permissionName: string,
  user: ScopeFilterUserContext,
  options: ScopeFilterOptions = {},
): Record<string, any> {
  const { ownerField = 'assignedToEmployeeId', employeeRelation = 'employees' } = options;
  const base: Record<string, any> = { companyId: user.companyId };
  const scope = scopes?.[permissionName] ?? PermissionScope.COMPANY;

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

/**
 * Builds a Prisma where filter for entities that directly hold teamId/departmentId
 * (e.g. Employee model). Use this instead of `getEffectiveScopeFilter` when
 * the entity has its own team/department fields rather than going through a relation.
 *
 * @param scopes - The scopes map from PermissionsGuard.
 * @param permissionName - The permission key to look up.
 * @param user - User context with companyId, employeeId, teamId, departmentId.
 * @param ownerField - Field for OWN-scoped filter. Defaults to 'id' (self).
 * @returns A Prisma where object.
 */
export function getDirectScopeFilter(
  scopes: Record<string, string> | undefined,
  permissionName: string,
  user: ScopeFilterUserContext,
  ownerField: string = 'id',
): Record<string, any> {
  const scope = scopes?.[permissionName] ?? PermissionScope.COMPANY;
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
      return { ...base, teamId: user.teamId };

    case PermissionScope.DEPARTMENT:
      if (!user.departmentId) {
        if (user.employeeId) return { ...base, [ownerField]: user.employeeId };
        return base;
      }
      return { ...base, departmentId: user.departmentId };

    case PermissionScope.COMPANY:
    case PermissionScope.OWNER_ONLY:
      return base;

    default:
      if (user.employeeId) return { ...base, [ownerField]: user.employeeId };
      return base;
  }
}

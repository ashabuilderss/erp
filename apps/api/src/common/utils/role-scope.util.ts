/**
 * Data scope utilities for role-based data access control.
 *
 * Replaces repetitive `role === 'EMPLOYEE' || role === 'FIELD_EMPLOYEE'` checks
 * across controllers and services with a single, testable function.
 */

export enum DataScope {
  /** See everything in the company (OWNER, ADMIN, MANAGER, TEAM_LEAD, HR_MANAGER, ACCOUNTS) */
  ALL = 'ALL',
  /** See team-level data (reserved for future MANAGER / TEAM_LEAD filtering) */
  TEAM = 'TEAM',
  /** See only own data (EMPLOYEE, FIELD_EMPLOYEE) */
  OWN = 'OWN',
}

/** Roles that operate at their own data scope only. */
const OWN_SCOPE_ROLES: ReadonlySet<string> = new Set([
  'EMPLOYEE',
  'FIELD_EMPLOYEE',
]);

/**
 * Determine the data scope for a given role string.
 */
export function getDataScope(role: string): DataScope {
  if (OWN_SCOPE_ROLES.has(role)) {
    return DataScope.OWN;
  }
  // OWNER, ADMIN, MANAGER, TEAM_LEAD, HR_MANAGER, ACCOUNTS, etc.
  // MANAGER and TEAM_LEAD currently see ALL; upgrade to TEAM when team filtering is added.
  return DataScope.ALL;
}

/**
 * Returns `true` when the role should only see its own records.
 */
export function isOwnDataScope(role: string): boolean {
  return getDataScope(role) === DataScope.OWN;
}

/**
 * Derives the `myEmployeeId` filter value from role + employeeId.
 *
 * Use this in controllers to replace patterns like:
 * ```ts
 * role === 'EMPLOYEE' || role === 'FIELD_EMPLOYEE' ? employeeId! : undefined
 * ```
 *
 * @returns The employeeId to pass to the service, or `undefined` when the role should see all data.
 */
export function getScopedEmployeeId(
  role: string,
  employeeId?: string | null,
): string | undefined {
  if (isOwnDataScope(role) && employeeId) {
    return employeeId;
  }
  return undefined;
}

/**
 * Polymorphic data-scope utility for role-based data access control.
 *
 * Replaces repetitive `role === 'EMPLOYEE' || role === 'FIELD_EMPLOYEE'` checks
 * across controllers and services with a single, testable function.
 */

export enum DataScope {
  /** See everything in the company (OWNER, ADMIN, MANAGER, TEAM_LEAD, HR_MANAGER, ACCOUNTS, etc.) */
  ALL = 'ALL',
  /** See team-level data (reserved for future MANAGER / TEAM_LEAD filtering) */
  TEAM = 'TEAM',
  /** See only own data (EMPLOYEE, FIELD_EMPLOYEE) */
  OWN = 'OWN',
}

/**
 * Determine the data scope for a given role string.
 *
 * - OWNER / ADMIN → ALL
 * - MANAGER / TEAM_LEAD / HR_MANAGER → TEAM
 * - Everything else → OWN
 */
export function getDataScope(role: string): DataScope {
  const upperRole = role.toUpperCase();
  if (upperRole === 'OWNER' || upperRole === 'ADMIN') return DataScope.ALL;
  if (
    upperRole === 'MANAGER' ||
    upperRole === 'TEAM_LEAD' ||
    upperRole === 'HR_MANAGER'
  )
    return DataScope.TEAM;
  return DataScope.OWN;
}

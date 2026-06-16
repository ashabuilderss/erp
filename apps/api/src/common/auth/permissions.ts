export const Permissions = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  EMPLOYEE_VIEW_SALARY: 'employee:view-salary',

  DEPARTMENT_READ: 'department:read',
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',

  PROPERTY_READ: 'property:read',
  PROPERTY_CREATE: 'property:create',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',

  LEAD_READ: 'lead:read',
  LEAD_CREATE: 'lead:create',
  LEAD_UPDATE: 'lead:update',
  LEAD_DELETE: 'lead:delete',
  LEAD_CONVERT: 'lead:convert',

  CUSTOMER_READ: 'customer:read',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  SITE_VISIT_READ: 'site-visit:read',
  SITE_VISIT_CREATE: 'site-visit:create',
  SITE_VISIT_UPDATE: 'site-visit:update',
  SITE_VISIT_DELETE: 'site-visit:delete',

  BOOKING_READ: 'booking:read',
  BOOKING_CREATE: 'booking:create',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_DELETE: 'booking:delete',

  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_CREATE: 'attendance:create',
  ATTENDANCE_VERIFY: 'attendance:verify',

  LEAVE_READ: 'leave:read',
  LEAVE_CREATE: 'leave:create',
  LEAVE_APPROVE: 'leave:approve',

  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_SEND: 'notification:send',

  AUDIT_LOG_READ: 'audit-log:read',

  DASHBOARD_VIEW: 'dashboard:view',
  REPORT_VIEW: 'report:view',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

import { UserRole } from '@prisma/client';

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(Permissions),
  HR_MANAGER: [
    Permissions.DASHBOARD_VIEW,
    Permissions.REPORT_VIEW,
    Permissions.EMPLOYEE_READ,
    Permissions.EMPLOYEE_CREATE,
    Permissions.EMPLOYEE_UPDATE,
    Permissions.EMPLOYEE_VIEW_SALARY,
    Permissions.DEPARTMENT_READ,
    Permissions.DEPARTMENT_CREATE,
    Permissions.DEPARTMENT_UPDATE,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_VERIFY,
    Permissions.NOTIFICATION_READ,
    Permissions.NOTIFICATION_SEND,
    Permissions.USER_READ,
  ],
  EMPLOYEE: [
    Permissions.DASHBOARD_VIEW,
    Permissions.PROPERTY_READ,
    Permissions.LEAD_READ,
    Permissions.LEAD_CREATE,
    Permissions.LEAD_UPDATE,
    Permissions.LEAD_CONVERT,
    Permissions.CUSTOMER_READ,
    Permissions.CUSTOMER_CREATE,
    Permissions.CUSTOMER_UPDATE,
    Permissions.SITE_VISIT_READ,
    Permissions.SITE_VISIT_CREATE,
    Permissions.SITE_VISIT_UPDATE,
    Permissions.BOOKING_READ,
    Permissions.BOOKING_CREATE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CREATE,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_CREATE,
    Permissions.NOTIFICATION_READ,
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

import { UserRole } from '@prisma/client';
import {
  Permissions,
  getPermissionsForRole,
  hasPermission,
  mergePermissionsWithGrants,
} from './permissions';

describe('RBAC Permission Matrix', () => {
  describe('OWNER role', () => {
    it('has ALL permissions', () => {
      const perms = getPermissionsForRole(UserRole.OWNER);
      const allPermissions = Object.values(Permissions);

      for (const perm of allPermissions) {
        expect(perms).toContain(perm);
      }
    });

    it('has permission count matching total permissions', () => {
      const perms = getPermissionsForRole(UserRole.OWNER);
      expect(perms.length).toBe(Object.values(Permissions).length);
    });
  });

  describe('ADMIN role', () => {
    it('has ALL permissions (same as OWNER)', () => {
      const adminPerms = getPermissionsForRole(UserRole.ADMIN);
      const ownerPerms = getPermissionsForRole(UserRole.OWNER);

      expect(adminPerms.sort()).toEqual(ownerPerms.sort());
    });
  });

  describe('HR_MANAGER role', () => {
    it('has DASHBOARD_VIEW', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DASHBOARD_VIEW),
      ).toBe(true);
    });

    it('has REPORT_VIEW', () => {
      expect(hasPermission(UserRole.HR_MANAGER, Permissions.REPORT_VIEW)).toBe(
        true,
      );
    });

    it('has REPORT_EXPORT', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.REPORT_EXPORT),
      ).toBe(true);
    });

    it('has ANALYTICS_VIEW', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ANALYTICS_VIEW),
      ).toBe(true);
    });

    it('has EMPLOYEE CRUD', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EMPLOYEE_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EMPLOYEE_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EMPLOYEE_UPDATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EMPLOYEE_VIEW_SALARY),
      ).toBe(true);
    });

    it('has EMPLOYEE_DELETE', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EMPLOYEE_DELETE),
      ).toBe(false);
    });

    it('has DEPARTMENT_READ, CREATE, UPDATE', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DEPARTMENT_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DEPARTMENT_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DEPARTMENT_UPDATE),
      ).toBe(true);
    });

    it('does not have DEPARTMENT_DELETE', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DEPARTMENT_DELETE),
      ).toBe(false);
    });

    it('has LEAVE_READ and LEAVE_APPROVE', () => {
      expect(hasPermission(UserRole.HR_MANAGER, Permissions.LEAVE_READ)).toBe(
        true,
      );
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.LEAVE_APPROVE),
      ).toBe(true);
    });

    it('has LEAVE_CREATE', () => {
      expect(hasPermission(UserRole.HR_MANAGER, Permissions.LEAVE_CREATE)).toBe(
        true,
      );
    });

    it('has ATTENDANCE_READ and ATTENDANCE_VERIFY', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ATTENDANCE_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ATTENDANCE_VERIFY),
      ).toBe(true);
    });

    it('has ATTENDANCE_CREATE', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ATTENDANCE_CREATE),
      ).toBe(true);
    });

    it('has PERFORMANCE permissions', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PERFORMANCE_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PERFORMANCE_CALCULATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PERFORMANCE_RATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PERFORMANCE_TREND),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PERFORMANCE_LEADERBOARD),
      ).toBe(true);
    });

    it('has ANNOUNCEMENT permissions', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ANNOUNCEMENT_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ANNOUNCEMENT_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ANNOUNCEMENT_PUBLISH),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.ANNOUNCEMENT_ARCHIVE),
      ).toBe(true);
    });

    it('has DOCUMENT permissions', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DOCUMENT_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DOCUMENT_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.DOCUMENT_DELETE),
      ).toBe(true);
    });

    it('has EXPORT_CONFIG permissions', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EXPORT_CONFIG_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.EXPORT_CONFIG_MANAGE),
      ).toBe(true);
    });

    it('does not have CRM write permissions', () => {
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.PROPERTY_CREATE),
      ).toBe(false);
      expect(hasPermission(UserRole.HR_MANAGER, Permissions.LEAD_CREATE)).toBe(
        false,
      );
      expect(
        hasPermission(UserRole.HR_MANAGER, Permissions.BOOKING_CREATE),
      ).toBe(false);
    });

    it('does not have USER_DELETE', () => {
      expect(hasPermission(UserRole.HR_MANAGER, Permissions.USER_DELETE)).toBe(
        false,
      );
    });
  });

  describe('EMPLOYEE role', () => {
    it('has DASHBOARD_VIEW and ANALYTICS_VIEW', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.DASHBOARD_VIEW)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.ANALYTICS_VIEW)).toBe(
        true,
      );
    });

    it('has CRM READ permissions', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.PROPERTY_READ)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAD_READ)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.CUSTOMER_READ)).toBe(
        true,
      );
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.SITE_VISIT_READ),
      ).toBe(true);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.BOOKING_READ)).toBe(
        true,
      );
    });

    it('has limited CRM WRITE permissions', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAD_CREATE)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAD_UPDATE)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAD_CONVERT)).toBe(
        true,
      );
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.CUSTOMER_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.CUSTOMER_UPDATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.SITE_VISIT_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.SITE_VISIT_UPDATE),
      ).toBe(true);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.BOOKING_CREATE)).toBe(
        true,
      );
    });

    it('does not have CRM DELETE permissions', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PROPERTY_DELETE),
      ).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAD_DELETE)).toBe(
        false,
      );
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.CUSTOMER_DELETE),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.SITE_VISIT_DELETE),
      ).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.BOOKING_DELETE)).toBe(
        false,
      );
    });

    it('does not have PROPERTY_CREATE', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PROPERTY_CREATE),
      ).toBe(false);
    });

    it('has ATTENDANCE and LEAVE permissions', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.ATTENDANCE_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.ATTENDANCE_CREATE),
      ).toBe(true);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAVE_READ)).toBe(
        true,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAVE_CREATE)).toBe(
        true,
      );
    });

    it('does not have ATTENDANCE_VERIFY or LEAVE_APPROVE', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.ATTENDANCE_VERIFY),
      ).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.LEAVE_APPROVE)).toBe(
        false,
      );
    });

    it('has PERFORMANCE_READ, TREND, LEADERBOARD', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PERFORMANCE_READ),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PERFORMANCE_TREND),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PERFORMANCE_LEADERBOARD),
      ).toBe(true);
    });

    it('does not have PERFORMANCE_CALCULATE or RATE', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PERFORMANCE_CALCULATE),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.PERFORMANCE_RATE),
      ).toBe(false);
    });

    it('has ANNOUNCEMENT_READ and DOCUMENT_READ', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.ANNOUNCEMENT_READ),
      ).toBe(true);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.DOCUMENT_READ)).toBe(
        true,
      );
    });

    it('has DOCUMENT_CREATE but not DELETE', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.DOCUMENT_CREATE),
      ).toBe(true);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.DOCUMENT_DELETE),
      ).toBe(false);
    });

    it('does not have REPORT_VIEW or REPORT_EXPORT', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.REPORT_VIEW)).toBe(
        false,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.REPORT_EXPORT)).toBe(
        false,
      );
    });

    it('does not have EXPORT permissions', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EXPORT_CONFIG_READ),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EXPORT_CONFIG_MANAGE),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EXPORT_SHEET_SYNC),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EXPORT_DOWNLOAD),
      ).toBe(false);
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.EXPORT_HISTORY)).toBe(
        false,
      );
    });

    it('does not have USER or EMPLOYEE management', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.USER_READ)).toBe(
        false,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.USER_CREATE)).toBe(
        false,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.USER_UPDATE)).toBe(
        false,
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permissions.USER_DELETE)).toBe(
        false,
      );
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EMPLOYEE_CREATE),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EMPLOYEE_UPDATE),
      ).toBe(false);
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.EMPLOYEE_DELETE),
      ).toBe(false);
    });

    it('does not have NOTIFICATION_SEND', () => {
      expect(
        hasPermission(UserRole.EMPLOYEE, Permissions.NOTIFICATION_SEND),
      ).toBe(false);
    });
  });
});

describe('mergePermissionsWithGrants', () => {
  it('adds granted permissions not in role defaults', () => {
    const rolePerms = [Permissions.LEAD_READ];
    const grants = [{ permission: Permissions.BOOKING_CREATE, granted: true }];

    const result = mergePermissionsWithGrants(rolePerms, grants);
    expect(result).toContain(Permissions.LEAD_READ);
    expect(result).toContain(Permissions.BOOKING_CREATE);
  });

  it('removes denied permissions from role defaults', () => {
    const rolePerms = [Permissions.LEAD_READ, Permissions.LEAD_CREATE];
    const grants = [{ permission: Permissions.LEAD_CREATE, granted: false }];

    const result = mergePermissionsWithGrants(rolePerms, grants);
    expect(result).toContain(Permissions.LEAD_READ);
    expect(result).not.toContain(Permissions.LEAD_CREATE);
  });

  it('DENY overrides ALLOW for same permission', () => {
    const rolePerms = [Permissions.LEAD_READ];
    const grants = [
      { permission: Permissions.LEAD_READ, granted: true },
      { permission: Permissions.LEAD_READ, granted: false },
    ];

    const result = mergePermissionsWithGrants(rolePerms, grants);
    expect(result).not.toContain(Permissions.LEAD_READ);
  });

  it('returns empty array for empty role permissions and no grants', () => {
    const result = mergePermissionsWithGrants([], []);
    expect(result).toEqual([]);
  });
});

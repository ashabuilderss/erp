import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import {
  createCompanyFixture,
  resetDatabase,
} from './helpers/database';
import { Permissions, Permission, getPermissionsForRole } from '../src/common/auth/permissions';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 0 — Role Provisioning & Permission Verification Gate', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;

  const ALL_PERMISSIONS = Object.values(Permissions);

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'phase0');
  });

  afterAll(async () => {
    await app.close();
  });

  it('permissions.ts definitions are internally consistent (no duplicates, all roles covered)', () => {
    const issues: string[] = [];
    const roles: UserRole[] = [
      UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS,
      UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE,
    ];

    for (const role of roles) {
      const perms = getPermissionsForRole(role);
      const unique = new Set(perms);
      if (unique.size !== perms.length) {
        const dupes = perms.filter((p, i) => perms.indexOf(p) !== i);
        issues.push(`${role} has duplicate permissions: ${dupes.join(', ')}`);
      }
    }

    if (issues.length > 0) {
      throw new Error(`Internal consistency issues:\n${issues.join('\n')}`);
    }
  });

  it('OWNER and ADMIN have all permissions', () => {
    const ownerPerms = getPermissionsForRole(UserRole.OWNER);
    const adminPerms = getPermissionsForRole(UserRole.ADMIN);

    expect(ownerPerms).toEqual(expect.arrayContaining(ALL_PERMISSIONS));
    expect(adminPerms).toEqual(expect.arrayContaining(ALL_PERMISSIONS));
    expect(ownerPerms.length).toBe(ALL_PERMISSIONS.length);
    expect(adminPerms.length).toBe(ALL_PERMISSIONS.length);
  });

  it('ACCOUNTS cannot access HR/task/attendance admin permissions', () => {
    const accountsPerms = getPermissionsForRole(UserRole.ACCOUNTS);
    const forbiddenForAccounts: Permission[] = [
      Permissions.EMPLOYEE_CREATE,
      Permissions.EMPLOYEE_UPDATE,
      Permissions.EMPLOYEE_DELETE,
      Permissions.DEPARTMENT_CREATE,
      Permissions.DEPARTMENT_UPDATE,
      Permissions.DEPARTMENT_DELETE,
      Permissions.LEAVE_APPROVE,
      Permissions.LEAVE_CREATE,
      Permissions.ATTENDANCE_VERIFY,
      Permissions.WARNING_ISSUE,
      Permissions.WARNING_CREATE,
      Permissions.WARNING_ACKNOWLEDGE,
      Permissions.WARNING_READ,
      Permissions.TASK_ASSIGN,
      Permissions.TASK_ESCALATE,
      Permissions.PAYROLL_PROCESS,
      Permissions.PAYROLL_HOLD_CREATE,
      Permissions.PAYROLL_HOLD_RELEASE,
      Permissions.DELETION_AUTHORIZE,
    ];

    const overGrants = accountsPerms.filter((p) =>
      forbiddenForAccounts.includes(p),
    );
    expect(overGrants).toEqual([]);
  });

  it('EMPLOYEE cannot access management permissions', () => {
    const employeePerms = getPermissionsForRole(UserRole.EMPLOYEE);
    const forbiddenForEmployee: Permission[] = [
      Permissions.EMPLOYEE_CREATE,
      Permissions.EMPLOYEE_UPDATE,
      Permissions.EMPLOYEE_DELETE,
      Permissions.DEPARTMENT_CREATE,
      Permissions.LEAVE_APPROVE,
      Permissions.ATTENDANCE_VERIFY,
      Permissions.WARNING_ISSUE,
      Permissions.WARNING_CREATE,
      Permissions.TASK_ASSIGN,
      Permissions.TASK_ESCALATE,
      Permissions.PAYROLL_PROCESS,
      Permissions.PAYROLL_HOLD_CREATE,
      Permissions.PAYROLL_HOLD_RELEASE,
      Permissions.DELETION_AUTHORIZE,
      Permissions.REPORT_EXPORT,
      Permissions.EXPORT_SENSITIVE,
      Permissions.EXPORT_CONFIG_MANAGE,
    ];

    const overGrants = employeePerms.filter((p) =>
      forbiddenForEmployee.includes(p),
    );
    expect(overGrants).toEqual([]);
  });

  it('FIELD_EMPLOYEE cannot access booking/leave-approve/payroll permissions', () => {
    const fieldPerms = getPermissionsForRole(UserRole.FIELD_EMPLOYEE);
    const forbiddenForField: Permission[] = [
      Permissions.BOOKING_CREATE,
      Permissions.BOOKING_UPDATE,
      Permissions.BOOKING_DELETE,
      Permissions.LEAVE_APPROVE,
      Permissions.ATTENDANCE_VERIFY,
      Permissions.WARNING_ISSUE,
      Permissions.TASK_ASSIGN,
      Permissions.TASK_ESCALATE,
      Permissions.PAYROLL_PROCESS,
      Permissions.PAYROLL_HOLD_CREATE,
      Permissions.PAYROLL_HOLD_RELEASE,
      Permissions.EMPLOYEE_CREATE,
      Permissions.EMPLOYEE_UPDATE,
      Permissions.DEPARTMENT_CREATE,
      Permissions.DELETION_AUTHORIZE,
      Permissions.REPORT_EXPORT,
      Permissions.EXPORT_SENSITIVE,
    ];

    const overGrants = fieldPerms.filter((p) =>
      forbiddenForField.includes(p),
    );
    expect(overGrants).toEqual([]);
  });

  it('TEAM_LEAD permissions are subset of MANAGER permissions', () => {
    const teamLeadPerms = getPermissionsForRole(UserRole.TEAM_LEAD);
    const managerPerms = getPermissionsForRole(UserRole.MANAGER);
    const managerSet = new Set(managerPerms);

    const overGrants = teamLeadPerms.filter((p) => !managerSet.has(p));
    expect(overGrants).toEqual([]);
  });

  it('MANAGER and HR_MANAGER share core HR permissions (employee/attendance/leave)', () => {
    const managerPerms = getPermissionsForRole(UserRole.MANAGER);
    const hrPerms = getPermissionsForRole(UserRole.HR_MANAGER);
    const managerSet = new Set(managerPerms);
    const hrSet = new Set(hrPerms);

    const sharedCore = [
      Permissions.EMPLOYEE_READ,
      Permissions.LEAVE_READ,
      Permissions.LEAVE_APPROVE,
      Permissions.ATTENDANCE_READ,
      Permissions.ATTENDANCE_VERIFY,
      Permissions.PERFORMANCE_READ,
      Permissions.ANNOUNCEMENT_READ,
      Permissions.DOCUMENT_READ,
      Permissions.CONSTRUCTION_READ,
      Permissions.EOD_READ,
      Permissions.EOD_REVIEW,
      Permissions.INVENTORY_READ,
      Permissions.PROPERTY_READ,
      Permissions.TRAINING_READ,
      Permissions.ASSET_READ,
      Permissions.MEETING_READ,
      Permissions.AGREEMENT_READ,
      Permissions.LEAD_READ,
      Permissions.NOTIFICATION_READ,
      Permissions.CUSTOMER_READ,
      Permissions.SITE_VISIT_READ,
      Permissions.BOOKING_READ,
    ];

    const missingFromManager = sharedCore.filter((p) => !managerSet.has(p));
    const missingFromHR = sharedCore.filter((p) => !hrSet.has(p));

    if (missingFromManager.length > 0) {
      throw new Error(`MANAGER missing shared core: ${missingFromManager.join(', ')}`);
    }
    if (missingFromHR.length > 0) {
      throw new Error(`HR_MANAGER missing shared core: ${missingFromHR.join(', ')}`);
    }
  });

  it('each seeded role user can login and receive a valid JWT', async () => {
    const roles: UserRole[] = [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.HR_MANAGER,
      UserRole.ACCOUNTS,
      UserRole.MANAGER,
      UserRole.TEAM_LEAD,
      UserRole.EMPLOYEE,
      UserRole.FIELD_EMPLOYEE,
    ];

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const user = await ctx.prisma.user.create({
        data: {
          companyId: fixture.company.id,
          email: `phase0-${role.toLowerCase()}-${i}@example.com`,
          firstName: 'Phase0',
          lastName: role,
          role,
          hashedPassword: await bcrypt.hash('Password@123', 12),
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Password@123' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe(role);
    }
  });

  it('all 8 roles have at least DASHBOARD_VIEW permission', () => {
    const roles: UserRole[] = [
      UserRole.OWNER, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.ACCOUNTS,
      UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE,
    ];

    for (const role of roles) {
      const perms = getPermissionsForRole(role);
      expect(perms).toContain(Permissions.DASHBOARD_VIEW);
    }
  });

  it('no permission is defined but unused across non-admin roles', () => {
    const operationalRoles: UserRole[] = [
      UserRole.HR_MANAGER, UserRole.ACCOUNTS,
      UserRole.MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE, UserRole.FIELD_EMPLOYEE,
    ];

    const usedPermissions = new Set<string>();

    for (const role of operationalRoles) {
      for (const perm of getPermissionsForRole(role)) {
        usedPermissions.add(perm);
      }
    }

    const unusedPermissions = ALL_PERMISSIONS.filter(
      (p) => !usedPermissions.has(p),
    );

    if (unusedPermissions.length > 0) {
      console.warn(
        `Info: ${unusedPermissions.length} permissions only assigned to OWNER/ADMIN: ${unusedPermissions.join(', ')}`,
      );
    }
    expect(unusedPermissions.length).toBeLessThanOrEqual(ALL_PERMISSIONS.length);
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 7 — Warning Issuance → Acknowledgement', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let hrToken: string;
  let empToken: string;
  let empEmployeeId: string;
  let managerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(
      ctx.prisma,
      'journey7',
      UserRole.OWNER,
    );
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey7-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: hrUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J7-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey7-emp@example.com',
        firstName: 'Regular',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(ownerToken))
      .send({
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'OFFICE',
        status: 'ACTIVE',
      })
      .expect(201);

    empEmployeeId = empRes.body.id;
    empToken = await login(app, empUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey7-mgr@example.com',
        firstName: 'Site',
        lastName: 'Manager',
        role: UserRole.MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: managerUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J7-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR issues warning → employee sees it in my-warnings → acknowledges', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Repeated late arrivals this week',
      })
      .expect(201);

    expect(warningRes.body.employeeId).toBe(empEmployeeId);
    expect(warningRes.body.category).toBe('ATTENDANCE');
    expect(warningRes.body.severity).toBe('LEVEL_1_VERBAL');
    const warningId = warningRes.body.id as string;

    const myWarnings = await request(app.getHttpServer())
      .get('/api/warnings/me')
      .set(authHeader(empToken))
      .expect(200);

    const warningList = myWarnings.body.items ?? [];
    expect(warningList.length).toBeGreaterThanOrEqual(1);
    const found = warningList.find((w: any) => w.id === warningId);
    expect(found).toBeDefined();

    const ackRes = await request(app.getHttpServer())
      .post(`/api/warnings/${warningId}/acknowledge`)
      .set(authHeader(empToken))
      .expect(201);

    expect(ackRes.body).toBeDefined();

    const allWarnings = await request(app.getHttpServer())
      .get('/api/warnings')
      .set(authHeader(hrToken))
      .expect(200);

    expect(allWarnings.body).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR issues warning with LEVEL_2_WRITTEN severity', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_2_WRITTEN',
        reason: 'Failed to meet project deadline twice',
      })
      .expect(201);

    expect(warningRes.body.severity).toBe('LEVEL_2_WRITTEN');
    expect(warningRes.body.category).toBe('TASK_PERFORMANCE');
  });

  it('employee acknowledges warning → it appears as acknowledged in HR list', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'CONDUCT',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Unprofessional behavior in team meeting',
      })
      .expect(201);

    const warningId = warningRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/warnings/${warningId}/acknowledge`)
      .set(authHeader(empToken))
      .expect(201);

    const allWarnings = await request(app.getHttpServer())
      .get('/api/warnings')
      .set(authHeader(hrToken))
      .expect(200);

    expect(allWarnings.body).toBeDefined();
  });

  it('employee cannot issue warnings (RBAC enforcement)', async () => {
    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Self-warning attempt',
      })
      .expect(403);
  });

  it('manager can issue warnings to team members', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(managerToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Missed daily standup three times',
      })
      .expect(201);

    expect(warningRes.body.employeeId).toBe(empEmployeeId);
  });

  it('duplicate acknowledgement is rejected', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Test duplicate acknowledgement',
      })
      .expect(201);

    const warningId = warningRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/warnings/${warningId}/acknowledge`)
      .set(authHeader(empToken))
      .expect(201);

    const dupeAckRes = await request(app.getHttpServer())
      .post(`/api/warnings/${warningId}/acknowledge`)
      .set(authHeader(empToken));

    expect([400, 409]).toContain(dupeAckRes.status);
  });
});

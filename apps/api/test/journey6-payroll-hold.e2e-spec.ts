import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 6 — Payroll Run With Active Hold', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empNoHoldId: string;
  let empWithHoldId: string;
  let accountsToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey6', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    // Create two employees: one normal, one that will get a hold
    const empNoHoldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey6-nohold@example.com',
        firstName: 'Regular',
        lastName: 'Worker',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empNoHoldRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(ownerToken))
      .send({
        userId: empNoHoldUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'OFFICE',
        status: 'ACTIVE',
        salary: 50000,
      })
      .expect(201);

    empNoHoldId = empNoHoldRes.body.id;

    const empWithHoldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey6-withhold@example.com',
        firstName: 'Held',
        lastName: 'Worker',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empWithHoldRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(ownerToken))
      .send({
        userId: empWithHoldUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'OFFICE',
        status: 'ACTIVE',
        salary: 60000,
      })
      .expect(201);

    empWithHoldId = empWithHoldRes.body.id;

    // Create an Accounts user
    const accountsUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey6-accounts@example.com',
        firstName: 'Accounts',
        lastName: 'Clerk',
        role: UserRole.ACCOUNTS,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: accountsUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J6-ACC-001',
        status: 'ACTIVE',
      },
    });

    accountsToken = await login(app, accountsUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner creates emergency hold → payroll run excludes held employee', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const holdRes = await request(app.getHttpServer())
      .post('/api/payroll-holds/emergency')
      .set(authHeader(ownerToken))
      .send({
        employeeId: empWithHoldId,
        holdType: 'FULL_HOLD',
        reason: 'Pending investigation for policy violation',
      })
      .expect(201);

    expect(holdRes.body.status).toBe('ACTIVE_HOLD');
    expect(holdRes.body.employeeId).toBe(empWithHoldId);

    const runRes = await request(app.getHttpServer())
      .post('/api/payroll-runs')
      .set(authHeader(ownerToken))
      .send({
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      })
      .expect(201);

    expect(runRes.body.status).toBe('DRAFT');
    const runId = runRes.body.id as string;

    const processRes = await request(app.getHttpServer())
      .post(`/api/payroll-runs/${runId}/process`)
      .set(authHeader(ownerToken))
      .expect(201);

    expect(processRes.body.status).toBe('COMPLETED');

    const detailRes = await request(app.getHttpServer())
      .get(`/api/payroll-runs/${runId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const payslips = detailRes.body.payslips as any[];
    expect(payslips).toBeDefined();
    expect(payslips.length).toBeGreaterThanOrEqual(1);

    const heldEmployeePayslip = payslips.find(
      (p: any) => p.employeeId === empWithHoldId,
    );
    expect(heldEmployeePayslip).toBeUndefined();

    const normalEmployeePayslip = payslips.find(
      (p: any) => p.employeeId === empNoHoldId,
    );
    expect(normalEmployeePayslip).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('accounts can view payroll runs (read-only)', async () => {
    await request(app.getHttpServer())
      .post('/api/payroll-runs')
      .set(authHeader(ownerToken))
      .send({
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/payroll-runs')
      .set(authHeader(accountsToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });

  it('employee cannot create payroll runs', async () => {
    const empToken = await login(
      app,
      'journey6-nohold@example.com',
      'Password@123',
    );

    await request(app.getHttpServer())
      .post('/api/payroll-runs')
      .set(authHeader(empToken))
      .send({
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      })
      .expect(403);
  });

  it('owner can view holds list', async () => {
    await request(app.getHttpServer())
      .post('/api/payroll-holds/emergency')
      .set(authHeader(ownerToken))
      .send({
        employeeId: empWithHoldId,
        holdType: 'FULL_HOLD',
        reason: 'Investigation pending',
      })
      .expect(201);

    const holdsRes = await request(app.getHttpServer())
      .get('/api/payroll-holds')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(holdsRes.body).toBeDefined();
  });

  it('employee cannot view holds', async () => {
    const empToken = await login(
      app,
      'journey6-nohold@example.com',
      'Password@123',
    );

    await request(app.getHttpServer())
      .get('/api/payroll-holds')
      .set(authHeader(empToken))
      .expect(403);
  });
});

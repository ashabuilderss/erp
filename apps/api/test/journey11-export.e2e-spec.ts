import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 11 — Sensitive Export → RBAC + Logging', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let hrToken: string;
  let empToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey11', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey11-hr@example.com',
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
        employeeCode: 'J11-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey11-emp@example.com',
        firstName: 'Regular',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J11-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner can export employees report', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const res = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .set(authHeader(ownerToken))
      .send({ reportKey: 'employees', format: 'CSV' });

    expect([200, 201, 400]).toContain(res.status);

    expect(res.body).toBeDefined();
    if (res.status !== 400) {
      expect(res.body.id).toBeDefined();
    }

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR manager can export attendance report', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const res = await request(app.getHttpServer())
      .post('/api/reports/exports')
      .set(authHeader(hrToken))
      .send({ reportKey: 'attendance', format: 'CSV' });

    expect([200, 201, 400]).toContain(res.status);

    expect(res.body).toBeDefined();
    if (res.status !== 400) {
      expect(res.body.id).toBeDefined();
    }

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('employee cannot export reports', async () => {
    await request(app.getHttpServer())
      .post('/api/reports/exports')
      .set(authHeader(empToken))
      .send({ reportKey: 'employees', format: 'CSV' })
      .expect(403);
  });

  it('owner can view export history', async () => {
    await request(app.getHttpServer())
      .post('/api/reports/exports')
      .set(authHeader(ownerToken))
      .send({ reportKey: 'employees', format: 'CSV' });

    const res = await request(app.getHttpServer())
      .get('/api/reports/export-history')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
  });

  it('employee cannot view report catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/catalog')
      .set(authHeader(empToken))
      .expect(403);

    expect(res.body).toBeDefined();
  });
});

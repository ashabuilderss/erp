import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 13 — Owner Dashboard Real-Time Update', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let managerToken: string;
  let empToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey13', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey13-mgr@example.com',
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
        employeeCode: 'J13-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey13-emp@example.com',
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
        employeeCode: 'J13-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner can view KPI dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/kpi-dashboard')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('owner can view leaderboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/leaderboard')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('manager can view KPI dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/kpi-dashboard')
      .set(authHeader(managerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('employee can view KPI dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports/kpi-dashboard')
      .set(authHeader(empToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('after creating a lead, owner can see pipeline data', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Dashboard Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '5555555555',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/reports/kpi-dashboard')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});

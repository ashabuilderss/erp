import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 23 — Performance Analytics', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let hrToken: string;
  let empToken: string;
  let empEmployeeId: string;
  let hrEmployeeId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey23', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey23-hr@example.com',
        firstName: 'Perf',
        lastName: 'HR',
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
        employeeCode: 'J23-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const hrEmp = await ctx.prisma.employee.findFirst({
      where: { userId: hrUser.id, companyId: fixture.company.id },
    });
    hrEmployeeId = hrEmp!.id;

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey23-emp@example.com',
        firstName: 'Perf',
        lastName: 'Emp',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empEmployee = await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J23-EMP-001',
        status: 'ACTIVE',
      },
    });

    empEmployeeId = empEmployee.id;
    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR calculates performance score for employee', async () => {
    const period = '2026-07';

    const res = await request(app.getHttpServer())
      .post('/api/performance-scores/calculate')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        period,
        periodType: 'MONTHLY',
      })
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('owner can view performance scores list', async () => {
    await request(app.getHttpServer())
      .post('/api/performance-scores/calculate')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        period: '2026-07',
        periodType: 'MONTHLY',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/performance-scores')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });

  it('employee can view trends', async () => {
    await request(app.getHttpServer())
      .post('/api/performance-scores/calculate')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        period: '2026-07',
        periodType: 'MONTHLY',
      })
      .expect(201);

    const trendsRes = await request(app.getHttpServer())
      .get('/api/performance-scores/trends')
      .set(authHeader(empToken))
      .query({ periodType: 'MONTHLY' })
      .expect(200);

    expect(trendsRes.body).toBeDefined();
  });

  it('employee can view leaderboard', async () => {
    await request(app.getHttpServer())
      .post('/api/performance-scores/calculate')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        period: '2026-07',
        periodType: 'MONTHLY',
      })
      .expect(201);

    const leaderboardRes = await request(app.getHttpServer())
      .get('/api/performance-scores/leaderboard')
      .set(authHeader(empToken))
      .query({ period: '2026-07', periodType: 'MONTHLY' })
      .expect(200);

    expect(leaderboardRes.body).toBeDefined();
  });

  it('HR can rate employee performance', async () => {
    const calcRes = await request(app.getHttpServer())
      .post('/api/performance-scores/calculate')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        period: '2026-07',
        periodType: 'MONTHLY',
      })
      .expect(201);

    const scoreId = calcRes.body.id as string;

    const rateRes = await request(app.getHttpServer())
      .post('/api/performance-scores/rate')
      .set(authHeader(hrToken))
      .send({
        performanceScoreId: scoreId,
        ratedById: hrEmployeeId,
        score: 8,
        comment: 'Good performance this quarter.',
      })
      .expect(201);

    expect(rateRes.body).toBeDefined();
  });
});

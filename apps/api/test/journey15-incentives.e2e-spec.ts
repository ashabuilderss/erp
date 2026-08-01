import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 15 — Incentive Announcement', () => {
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
    fixture = await createCompanyFixture(ctx.prisma, 'journey15', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey15-hr@example.com',
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
        employeeCode: 'J15-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey15-emp@example.com',
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
        employeeCode: 'J15-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner creates incentive → listed in active incentives', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(ownerToken))
      .send({
        title: 'Top Closer of the Month',
        description: 'Whoever closes the most deals this month wins.',
        award: 'Gold Trophy',
        value: 5000,
      })
      .expect(201);

    expect(createRes.body.title).toBe('Top Closer of the Month');
    expect(createRes.body.status).toBe('ACTIVE');

    const activeRes = await request(app.getHttpServer())
      .get('/api/incentives/active')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(activeRes.body).toBeDefined();
    expect(activeRes.body.data).toBeDefined();
    expect(activeRes.body.data.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('employee can view incentives and leaderboard', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(ownerToken))
      .send({
        title: 'Employee View Incentive',
        description: 'Testing employee view access.',
        award: 'Certificate',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/incentives')
      .set(authHeader(empToken))
      .expect(200);

    expect(listRes.body.data).toBeDefined();

    const leaderboardRes = await request(app.getHttpServer())
      .get('/api/incentives/leaderboard')
      .set(authHeader(empToken))
      .expect(200);

    expect(leaderboardRes.body).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR manager can view incentives', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(ownerToken))
      .send({
        title: 'HR View Incentive',
        description: 'Testing HR view access.',
        award: 'Bonus',
        value: 10000,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/incentives')
      .set(authHeader(hrToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('employee cannot create incentives', async () => {
    await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(empToken))
      .send({
        title: 'Unauthorized Incentive',
        description: 'This should fail.',
        award: 'Nothing',
      })
      .expect(403);
  });

  it('owner can close incentive with winner', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(ownerToken))
      .send({
        title: 'Closeable Incentive',
        description: 'This will be closed.',
        award: 'Trophy',
      })
      .expect(201);

    const incentiveId = createRes.body.id as string;

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/incentives/${incentiveId}`)
      .set(authHeader(ownerToken))
      .send({
        status: 'CLOSED',
        winnerId: fixture.employee.id,
      })
      .expect(200);

    expect(closeRes.body.status).toBe('CLOSED');
    expect(closeRes.body.winnerId).toBe(fixture.employee.id);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});

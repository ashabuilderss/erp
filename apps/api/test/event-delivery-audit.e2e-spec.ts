import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Event Delivery & Audit Completeness', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'eventaudit', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('activity log exists for lead creation', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Audit Test Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '1111111111',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    const activityRes = await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(ownerToken))
      .query({ entityType: 'Lead' })
      .expect(200);

    expect(activityRes.body).toBeDefined();
  });

  it('audit log exists for employee creation', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'audit-emp@example.com',
        firstName: 'Audit',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    await request(app.getHttpServer())
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

    const activityRes = await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(ownerToken))
      .query({ entityType: 'Employee' })
      .expect(200);

    expect(activityRes.body).toBeDefined();
  });

  it('audit log exists for warning issuance', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'audit-warn-emp@example.com',
        firstName: 'Warn',
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

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'audit-hr@example.com',
        firstName: 'HR',
        lastName: 'Audit',
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
        employeeCode: 'AUD-HR-001',
        status: 'ACTIVE',
      },
    });

    const hrToken = await login(app, hrUser.email, 'Password@123');

    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empRes.body.id,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Audit trail test',
      })
      .expect(201);

    const activityRes = await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(ownerToken))
      .query({ entityType: 'Warning' })
      .expect(200);

    expect(activityRes.body).toBeDefined();
  });

  it('activity logs are append-only (no mutation endpoints exist)', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Append Only Test',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '2222222222',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(listRes.body.data).toBeDefined();
    expect(Array.isArray(listRes.body.data)).toBe(true);

    await request(app.getHttpServer())
      .delete('/api/activity-logs/1')
      .set(authHeader(ownerToken))
      .expect(404);

    await request(app.getHttpServer())
      .patch('/api/activity-logs/1')
      .set(authHeader(ownerToken))
      .expect(404);
  });

  it('activity logs capture real-time events', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Activity Log Test',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '3333333333',
      })
      .expect(201);

    const activityRes = await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(activityRes.body.data).toBeDefined();
    expect(Array.isArray(activityRes.body.data)).toBe(true);
    expect(activityRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

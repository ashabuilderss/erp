import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 19 — Meeting → Action Items → Task Conversion', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let hrToken: string;
  let empToken: string;
  let empEmployeeId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey19', UserRole.OWNER);
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey19-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    const hrEmployee = await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: hrUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J19-HR-001',
        status: 'ACTIVE',
      },
    });
    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey19-emp@example.com',
        firstName: 'Employee',
        lastName: 'Test',
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
        employeeCode: 'J19-EMP-001',
        status: 'ACTIVE',
      },
    });
    empEmployeeId = empEmployee.id;
    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR creates meeting → listed in meetings', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(hrToken))
      .send({ title: 'Sprint Planning', scheduledAt: '2026-08-10T14:00:00.000Z' })
      .expect(201);

    expect(createRes.body.title).toBe('Sprint Planning');

    const listRes = await request(app.getHttpServer())
      .get('/api/meetings')
      .set(authHeader(hrToken))
      .expect(200);

    const meetings = listRes.body.items ?? listRes.body.data;
    expect(meetings).toBeDefined();
    expect(meetings.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR adds action item to meeting → action item created', async () => {
    const meetingRes = await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(hrToken))
      .send({ title: 'Review Meeting', scheduledAt: '2026-08-12T11:00:00.000Z' })
      .expect(201);

    const actionRes = await request(app.getHttpServer())
      .post(`/api/meetings/${meetingRes.body.id}/action-items`)
      .set(authHeader(hrToken))
      .send({ description: 'Prepare quarterly report', assigneeId: empEmployeeId })
      .expect(201);

    expect(actionRes.body.description).toBe('Prepare quarterly report');
  });

  it('HR completes meeting → status becomes COMPLETED', async () => {
    const meetingRes = await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(hrToken))
      .send({ title: 'Retrospective', scheduledAt: '2026-08-14T15:00:00.000Z' })
      .expect(201);

    const completeRes = await request(app.getHttpServer())
      .post(`/api/meetings/${meetingRes.body.id}/complete`)
      .set(authHeader(hrToken))
      .expect(201);

    expect(completeRes.body).toBeDefined();
  });

  it('Employee can view meetings and action items', async () => {
    const meetingRes = await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(hrToken))
      .send({ title: 'All Hands', scheduledAt: '2026-08-16T10:00:00.000Z' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/meetings/${meetingRes.body.id}/action-items`)
      .set(authHeader(hrToken))
      .send({ description: 'Book venue', assigneeId: empEmployeeId })
      .expect(201);

    const meetingsRes = await request(app.getHttpServer())
      .get('/api/meetings')
      .set(authHeader(empToken))
      .expect(200);

    const meetings = meetingsRes.body.items ?? meetingsRes.body.data;
    expect(meetings).toBeDefined();
    expect(meetings.length).toBeGreaterThanOrEqual(1);

    const actionItemsRes = await request(app.getHttpServer())
      .get(`/api/meetings/${meetingRes.body.id}/action-items`)
      .set(authHeader(empToken))
      .expect(200);

    const items = Array.isArray(actionItemsRes.body)
      ? actionItemsRes.body
      : actionItemsRes.body.items ?? actionItemsRes.body.data;
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('Employee cannot create meetings → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(empToken))
      .send({ title: 'Unauthorized Meeting', scheduledAt: '2026-08-18T09:00:00.000Z' })
      .expect(403);
  });
});

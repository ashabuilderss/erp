import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 25 — Daily EOD Reporting + Pending-Task Nudge', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let empEmployeeId: string;
  let fieldToken: string;
  let managerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey25', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey25-emp@example.com',
        firstName: 'EOD',
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
        employeeCode: 'J25-EMP-001',
        status: 'ACTIVE',
      },
    });

    empEmployeeId = empEmployee.id;
    empToken = await login(app, empUser.email, 'Password@123');

    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey25-field@example.com',
        firstName: 'EOD',
        lastName: 'Field',
        role: UserRole.FIELD_EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: fieldUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J25-FLD-001',
        status: 'ACTIVE',
      },
    });

    fieldToken = await login(app, fieldUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey25-mgr@example.com',
        firstName: 'EOD',
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
        employeeCode: 'J25-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('employee submits EOD report → visible in my reports', async () => {
    const today = new Date().toISOString().split('T')[0];

    const createRes = await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Completed 3 tasks and reviewed 2 documents.',
        challenges: 'Slow internet affected cloud sync.',
        tomorrowPlan: 'Finish documentation for Phase 2.',
      })
      .expect(201);

    expect(createRes.body.status).toBe('DRAFT');

    const myRes = await request(app.getHttpServer())
      .get('/api/eod-reports/my')
      .set(authHeader(empToken))
      .expect(200);

    expect(myRes.body).toBeDefined();
  });

  it('employee views pending tasks (nudge)', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Complete safety checklist',
        priority: 'IMPORTANT',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const tasksRes = await request(app.getHttpServer())
      .get('/api/tasks/me')
      .set(authHeader(empToken))
      .expect(200);

    const items = tasksRes.body.items ?? [];
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('field employee can submit EOD', async () => {
    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(fieldToken))
      .send({
        reportDate: today,
        accomplishments: 'Visited 2 sites, took progress photos, updated inventory.',
      })
      .expect(201);
  });

  it('employee cannot review own EOD → 403', async () => {
    const today = new Date().toISOString().split('T')[0];

    const createRes = await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Routine maintenance and cleanup.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/eod-reports/${createRes.body.id as string}/review`)
      .set(authHeader(empToken))
      .send({ status: 'REVIEWED' })
      .expect(403);
  });

  it('manager can view team EOD reports', async () => {
    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Completed 5 structural inspections.',
        challenges: 'Weather delays.',
        tomorrowPlan: 'Continue foundation checks.',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/eod-reports')
      .set(authHeader(managerToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });
});

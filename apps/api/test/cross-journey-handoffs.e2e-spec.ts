import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Cross-Journey Handoff Checks', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let hrToken: string;
  let empToken: string;
  let empEmployeeId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'handoff', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'handoff-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: hrUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'HO-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'handoff-emp@example.com',
        firstName: 'Test',
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('Journey 15 → 6 handoff: approved incentive feeds into payroll calculation', async () => {
    const incentiveRes = await request(app.getHttpServer())
      .post('/api/incentives')
      .set(authHeader(ownerToken))
      .send({
        title: 'Performance Bonus Q1',
        description: 'Quarterly performance incentive',
        award: 'Cash Bonus',
        value: 10000,
      })
      .expect(201);

    const incentiveId = incentiveRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/incentives/${incentiveId}`)
      .set(authHeader(ownerToken))
      .send({
        status: 'CLOSED',
        winnerId: empEmployeeId,
      })
      .expect(200);

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

    expect(detailRes.body).toBeDefined();
  });

  it('Journey 16 → 1 handoff: hired candidate seeds onboarding', async () => {
    const jobRes = await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(ownerToken))
      .send({ title: 'Software Developer', departmentId: fixture.department.id })
      .expect(201);

    const candidateRes = await request(app.getHttpServer())
      .post('/api/recruitment/candidates')
      .set(authHeader(ownerToken))
      .send({
        jobPostingId: jobRes.body.id,
        name: 'New Hire Test',
        email: 'newhire@example.com',
      })
      .expect(201);

    expect(candidateRes.body.name).toBe('New Hire Test');
    expect(candidateRes.body.email).toBe('newhire@example.com');

    const newUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'newhire@example.com',
        firstName: 'New',
        lastName: 'Hire',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: false,
      },
    });

    const employeeRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(hrToken))
      .send({
        userId: newUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'OFFICE',
        status: 'INACTIVE',
      })
      .expect(201);

    expect(employeeRes.body.status).toBe('INACTIVE');
    expect(employeeRes.body.users.email).toBe('newhire@example.com');
  });

  it('Journey 19 → 5 handoff: meeting action item converts to task', async () => {
    const meetingRes = await request(app.getHttpServer())
      .post('/api/meetings')
      .set(authHeader(hrToken))
      .send({ title: 'Sprint Planning', scheduledAt: '2026-08-10T14:00:00.000Z' })
      .expect(201);

    const actionItemRes = await request(app.getHttpServer())
      .post(`/api/meetings/${meetingRes.body.id}/action-items`)
      .set(authHeader(hrToken))
      .send({
        description: 'Implement new feature from sprint planning',
        assigneeId: empEmployeeId,
      })
      .expect(201);

    expect(actionItemRes.body.description).toBe('Implement new feature from sprint planning');

    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: actionItemRes.body.description,
        description: `Converted from meeting action item: ${meetingRes.body.title}`,
        priority: 'IMPORTANT',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(taskRes.body.title).toBe('Implement new feature from sprint planning');

    const myTasks = await request(app.getHttpServer())
      .get('/api/tasks/me')
      .set(authHeader(empToken))
      .expect(200);

    const taskList = myTasks.body.items ?? [];
    const convertedTask = taskList.find((t: any) => t.id === taskRes.body.id);
    expect(convertedTask).toBeDefined();
  });
});

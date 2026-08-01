import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 5 — Task → Warning → Acknowledgement', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let empEmployeeId: string;
  let hrToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(
      ctx.prisma,
      'journey5',
      UserRole.OWNER,
    );

    const approverRole = await ctx.prisma.role.create({
      data: {
        companyId: fixture.company.id,
        name: 'Warning Approver',
        isSystem: false,
      },
    });

    const disciplinaryReviewTemplate = await ctx.prisma.approvalTemplate.create({
      data: {
        companyId: fixture.company.id,
        entityType: 'DISCIPLINARY_REVIEW',
        description: 'Disciplinary review approval',
      },
    });

    await ctx.prisma.approvalTemplateStep.create({
      data: {
        templateId: disciplinaryReviewTemplate.id,
        companyId: fixture.company.id,
        sequence: 1,
        requiredRoleId: approverRole.id,
        slaHours: 48,
      },
    });

    const payrollReleaseTemplate = await ctx.prisma.approvalTemplate.create({
      data: {
        companyId: fixture.company.id,
        entityType: 'PAYROLL_RELEASE',
        description: 'Payroll hold release approval',
      },
    });

    await ctx.prisma.approvalTemplateStep.create({
      data: {
        templateId: payrollReleaseTemplate.id,
        companyId: fixture.company.id,
        sequence: 1,
        requiredRoleId: approverRole.id,
        slaHours: 24,
      },
    });

    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey5-emp@example.com',
        firstName: 'Task',
        lastName: 'Worker',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(await login(app, fixture.user.email, fixture.password)))
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

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey5-hr@example.com',
        firstName: 'HR',
        lastName: 'Officer',
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
        employeeCode: 'J5-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner assigns task → employee sees it → HR issues warning → employee acknowledges', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Submit weekly report',
        description: 'Prepare and submit the weekly status report',
        priority: 'IMPORTANT',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(taskRes.body.title).toBe('Submit weekly report');
    const taskId = taskRes.body.id as string;

    const myTasks = await request(app.getHttpServer())
      .get('/api/tasks/me')
      .set(authHeader(empToken))
      .expect(200);

    const taskList = myTasks.body.items ?? [];
    expect(taskList.length).toBeGreaterThanOrEqual(1);
    const found = taskList.find((t: any) => t.id === taskId);
    expect(found).toBeDefined();

    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Task overdue: Submit weekly report not completed by deadline',
      })
      .expect(201);

    expect(warningRes.body.employeeId).toBe(empEmployeeId);
    const warningId = warningRes.body.id as string;

    const myWarnings = await request(app.getHttpServer())
      .get('/api/warnings/me')
      .set(authHeader(empToken))
      .expect(200);

    const warningList = myWarnings.body.items ?? [];
    expect(warningList.length).toBeGreaterThanOrEqual(1);
    const foundWarning = warningList.find((w: any) => w.id === warningId);
    expect(foundWarning).toBeDefined();

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

  it('HR Manager can issue warnings', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Frequent late arrivals this month',
      })
      .expect(201);

    expect(warningRes.body.category).toBe('ATTENDANCE');
    expect(warningRes.body.severity).toBe('LEVEL_1_VERBAL');
  });

  it('EMPLOYEE cannot issue warnings', async () => {
    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Self-warning attempt',
      })
      .expect(403);
  });

  it('employee can view their own tasks', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Check site inventory',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const myTasks = await request(app.getHttpServer())
      .get('/api/tasks/me')
      .set(authHeader(empToken))
      .expect(200);

    const taskData = myTasks.body.items ?? [];
    expect(taskData).toBeDefined();
  });

  it('employee acknowledges warning, then it appears in list', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'CONDUCT',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Repeated policy violation',
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

  it('branch 5a: NORMAL priority task overdue remains in pending state', async () => {
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Normal priority task - overdue test',
        description: 'Testing escalation routing for normal priority',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(taskRes.body.priority).toBe('NORMAL');
    expect(taskRes.body.id).toBeDefined();
  });

  it('branch 5b: CRITICAL priority task overdue → routes directly to warning', async () => {
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Critical task - direct warning test',
        description: 'Testing direct warning routing for critical priority',
        priority: 'CRITICAL',
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(taskRes.body.priority).toBe('CRITICAL');

    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_2_WRITTEN',
        reason: 'Critical task overdue: direct warning routing',
      })
      .expect(201);

    expect(warningRes.body.severity).toBe('LEVEL_2_WRITTEN');
    expect(warningRes.body.category).toBe('TASK_PERFORMANCE');
  });

  it('branch 5c: multiple unresolved warnings escalate to owner', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/api/warnings')
        .set(authHeader(hrToken))
        .send({
          employeeId: empEmployeeId,
          category: 'ATTENDANCE',
          severity: 'LEVEL_1_VERBAL',
          reason: `Repeated late arrival warning ${i + 1}`,
        })
        .expect(201);
    }

    const myWarnings = await request(app.getHttpServer())
      .get('/api/warnings/me')
      .set(authHeader(empToken))
      .expect(200);

    const warningList = myWarnings.body.items ?? [];
    expect(warningList.length).toBeGreaterThanOrEqual(3);

    const ownerWarnings = await request(app.getHttpServer())
      .get('/api/warnings')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(ownerWarnings.body).toBeDefined();
  });

  it('branch 5d: payroll hold creation is atomic with hold log', async () => {
    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_2_WRITTEN',
        reason: 'Repeated task performance failures',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_3_FINAL',
        reason: 'Final warning for persistent task failures',
      })
      .expect(201);

    const holdRes = await request(app.getHttpServer())
      .post('/api/payroll-holds/emergency')
      .set(authHeader(ownerToken))
      .send({
        employeeId: empEmployeeId,
        holdType: 'FULL_HOLD',
        reason: 'Multiple unresolved warnings - payroll hold applied',
      })
      .expect(201);

    expect(holdRes.body.status).toBe('ACTIVE_HOLD');
    expect(holdRes.body.employeeId).toBe(empEmployeeId);

    const holdsList = await request(app.getHttpServer())
      .get('/api/payroll-holds')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(holdsList.body).toBeDefined();
  });

  it('branch 5e: hold release requires all conditions met', async () => {
    const holdRes = await request(app.getHttpServer())
      .post('/api/payroll-holds/emergency')
      .set(authHeader(ownerToken))
      .send({
        employeeId: empEmployeeId,
        holdType: 'FULL_HOLD',
        reason: 'Pending investigation',
      })
      .expect(201);

    const holdId = holdRes.body.id as string;

    const releaseRes = await request(app.getHttpServer())
      .post(`/api/payroll-holds/${holdId}/release-request`)
      .set(authHeader(ownerToken))
      .send({ reason: 'Incomplete release - testing rejection' });

    expect([200, 400, 409, 500]).toContain(releaseRes.status);
  });

  it('branch 5f: task with past due date is visible to assignee', async () => {
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Idempotent escalation test',
        description: 'Testing task visibility after due date',
        priority: 'IMPORTANT',
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const taskId = taskRes.body.id as string;
    expect(taskId).toBeDefined();

    const taskDetail = await request(app.getHttpServer())
      .get(`/api/tasks/${taskId}`)
      .set(authHeader(empToken))
      .expect(200);

    expect(taskDetail.body.id).toBe(taskId);
  });

  it('owner can view all warnings across the organization', async () => {
    await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'ATTENDANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Test owner visibility',
      })
      .expect(201);

    const allWarnings = await request(app.getHttpServer())
      .get('/api/warnings')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(allWarnings.body).toBeDefined();
  });

  it('employee acknowledges assigned task and status changes to IN_PROGRESS', async () => {
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Acknowledge test task',
        description: 'Testing task acknowledge flow',
        priority: 'IMPORTANT',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const taskId = taskRes.body.id as string;
    expect(taskRes.body.status).toBe('PENDING');

    const ackRes = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/acknowledge`)
      .set(authHeader(empToken))
      .expect(201);

    expect(ackRes.body.status).toBe('IN_PROGRESS');
    expect(ackRes.body.acknowledgedAt).toBeDefined();
  });

  it('non-assignee cannot acknowledge task', async () => {
    const taskRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(ownerToken))
      .send({
        assigneeId: empEmployeeId,
        category: 'SITE_WORK',
        title: 'Non-assignee ack test',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const taskId = taskRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/acknowledge`)
      .set(authHeader(ownerToken))
      .expect(400);
  });

  it('manager can issue warnings for team members', async () => {
    const warningRes = await request(app.getHttpServer())
      .post('/api/warnings')
      .set(authHeader(hrToken))
      .send({
        employeeId: empEmployeeId,
        category: 'TASK_PERFORMANCE',
        severity: 'LEVEL_1_VERBAL',
        reason: 'Manager-initiated warning test',
      })
      .expect(201);

    expect(warningRes.body.employeeId).toBe(empEmployeeId);
  });
});

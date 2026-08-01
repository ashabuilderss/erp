import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 16 — Recruitment Pipeline → Hire → Onboarding', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let hrToken: string;
  let managerToken: string;
  let empToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey16', UserRole.OWNER);
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey16-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    hrToken = await login(app, hrUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey16-manager@example.com',
        firstName: 'Manager',
        lastName: 'Test',
        role: UserRole.MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    managerToken = await login(app, managerUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey16-emp@example.com',
        firstName: 'Employee',
        lastName: 'Test',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR creates job posting → lists jobs → verifies count', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(hrToken))
      .send({ title: 'Software Engineer', departmentId: fixture.department.id })
      .expect(201);

    expect(createRes.body.title).toBe('Software Engineer');

    const listRes = await request(app.getHttpServer())
      .get('/api/recruitment/jobs')
      .set(authHeader(hrToken))
      .expect(200);

    const jobs = listRes.body.items ?? listRes.body.data;
    expect(jobs).toBeDefined();
    expect(jobs.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR adds candidate → candidate appears in list', async () => {
    const jobRes = await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(hrToken))
      .send({ title: 'Designer', departmentId: fixture.department.id })
      .expect(201);

    const candidateRes = await request(app.getHttpServer())
      .post('/api/recruitment/candidates')
      .set(authHeader(hrToken))
      .send({
        jobPostingId: jobRes.body.id,
        name: 'Rahul Sharma',
        email: 'rahul-candidate@example.com',
      })
      .expect(201);

    expect(candidateRes.body.name).toBe('Rahul Sharma');

    const listRes = await request(app.getHttpServer())
      .get('/api/recruitment/candidates')
      .set(authHeader(hrToken))
      .expect(200);

    const candidates = listRes.body.items ?? listRes.body.data;
    expect(candidates).toBeDefined();
    expect(candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('HR schedules interview for candidate → interview created', async () => {
    const jobRes = await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(hrToken))
      .send({ title: 'Backend Dev', departmentId: fixture.department.id })
      .expect(201);

    const candidateRes = await request(app.getHttpServer())
      .post('/api/recruitment/candidates')
      .set(authHeader(hrToken))
      .send({
        jobPostingId: jobRes.body.id,
        name: 'Priya Patel',
        email: 'priya-candidate@example.com',
      })
      .expect(201);

    const interviewRes = await request(app.getHttpServer())
      .post(`/api/recruitment/candidates/${candidateRes.body.id}/interviews`)
      .set(authHeader(hrToken))
      .send({
        interviewerId: fixture.user.id,
        scheduledAt: '2026-08-15T10:00:00.000Z',
      })
      .expect(201);

    expect(interviewRes.body.id).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('Manager cannot view jobs (no RECRUITMENT_READ) → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(hrToken))
      .send({ title: 'QA Engineer', departmentId: fixture.department.id })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/recruitment/jobs')
      .set(authHeader(managerToken))
      .expect(403);
  });

  it('Employee cannot create job postings → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/recruitment/jobs')
      .set(authHeader(empToken))
      .send({ title: 'HR Intern', departmentId: fixture.department.id })
      .expect(403);
  });
});

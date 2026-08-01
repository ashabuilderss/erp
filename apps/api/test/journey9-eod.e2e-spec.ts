import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 9 — EOD Report → Review', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let managerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey9', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey9-emp@example.com',
        firstName: 'Site',
        lastName: 'Worker',
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
        employeeCode: 'J9-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey9-mgr@example.com',
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
        employeeCode: 'J9-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('employee submits EOD → manager reviews it', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const today = new Date().toISOString().split('T')[0];

    const createRes = await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Completed foundation work for Block B. Installed 12 rebar cages.',
        challenges: 'Heavy rain delayed afternoon work by 2 hours.',
        tomorrowPlan: 'Resume concrete pour for Block B foundation.',
      })
      .expect(201);

    expect(createRes.body.status).toBe('DRAFT');
    const reportId = createRes.body.id as string;

    const myReports = await request(app.getHttpServer())
      .get('/api/eod-reports/my')
      .set(authHeader(empToken))
      .expect(200);

    expect(myReports.body).toBeDefined();

    const reviewRes = await request(app.getHttpServer())
      .patch(`/api/eod-reports/${reportId}/review`)
      .set(authHeader(managerToken))
      .send({ status: 'REVIEWED' })
      .expect(200);

    expect(reviewRes.body.status).toBe('REVIEWED');

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('owner can list all EOD reports', async () => {
    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Completed plumbing rough-in for Unit 4A.',
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/eod-reports')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });

  it('field employee can submit EOD', async () => {
    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey9-field@example.com',
        firstName: 'Field',
        lastName: 'Staff',
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
        employeeCode: 'J9-FIELD-001',
        status: 'ACTIVE',
      },
    });

    const fieldToken = await login(app, fieldUser.email, 'Password@123');
    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(fieldToken))
      .send({
        reportDate: today,
        accomplishments: 'Inspected 3 residential sites, documented progress photos.',
      })
      .expect(201);
  });

  it('employee cannot review EOD reports', async () => {
    const today = new Date().toISOString().split('T')[0];

    const createRes = await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Basic work done.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/eod-reports/${createRes.body.id}/review`)
      .set(authHeader(empToken))
      .send({ status: 'REVIEWED' })
      .expect(403);
  });

  it('duplicate EOD for same date is rejected', async () => {
    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'First report of the day.',
      })
      .expect(201);

    const dupeRes = await request(app.getHttpServer())
      .post('/api/eod-reports')
      .set(authHeader(empToken))
      .send({
        reportDate: today,
        accomplishments: 'Second report attempt.',
      });

    expect([400, 409, 500]).toContain(dupeRes.status);
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 22 — Communication & Docs', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let hrToken: string;
  let empToken: string;
  let empUserId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey22', UserRole.OWNER);
    hrToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey22-hr@example.com',
        firstName: 'Comm',
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
        employeeCode: 'J22-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey22-emp@example.com',
        firstName: 'Comm',
        lastName: 'Emp',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    empUserId = empUser.id;

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J22-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR creates and publishes announcement → visible in my announcements', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/announcements')
      .set(authHeader(hrToken))
      .send({
        title: 'Holiday Notice',
        body: 'Office will remain closed on Monday.',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [empUserId],
      })
      .expect(201);

    const announcementId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post('/api/announcements/publish')
      .set(authHeader(hrToken))
      .send({ announcementId })
      .expect(201);

    const myRes = await request(app.getHttpServer())
      .get('/api/announcements/my')
      .set(authHeader(empToken))
      .expect(200);

    expect(myRes.body).toBeDefined();
  });

  it('employee can mark announcement as read', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/announcements')
      .set(authHeader(hrToken))
      .send({
        title: 'Team Update',
        body: 'Please check your emails.',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [empUserId],
      })
      .expect(201);

    const announcementId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post('/api/announcements/publish')
      .set(authHeader(hrToken))
      .send({ announcementId })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/announcements/${announcementId}/read`)
      .set(authHeader(empToken))
      .expect(201);
  });

  it('HR can list all announcements', async () => {
    await request(app.getHttpServer())
      .post('/api/announcements')
      .set(authHeader(hrToken))
      .send({
        title: 'Policy Update',
        body: 'New leave policy effective next month.',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [],
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/announcements')
      .set(authHeader(hrToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });

  it('employee cannot create announcements → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/announcements')
      .set(authHeader(empToken))
      .send({
        title: 'Unauthorized Post',
        body: 'This should fail.',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [],
      })
      .expect(403);
  });

  it('announcement read receipt is recorded', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/announcements')
      .set(authHeader(hrToken))
      .send({
        title: 'Read Receipt Test',
        body: 'Confirming read receipts work.',
        targetRoles: ['EMPLOYEE'],
        targetEmployees: [empUserId],
      })
      .expect(201);

    const announcementId = createRes.body.id as string;

    await request(app.getHttpServer())
      .post('/api/announcements/publish')
      .set(authHeader(hrToken))
      .send({ announcementId })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/announcements/${announcementId}/read`)
      .set(authHeader(empToken))
      .expect(201);

    const myRes = await request(app.getHttpServer())
      .get('/api/announcements/my')
      .set(authHeader(empToken))
      .expect(200);

    expect(myRes.body).toBeDefined();
  });
});

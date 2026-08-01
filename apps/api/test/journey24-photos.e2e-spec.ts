import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 24 — Photo Progress Timeline', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let managerToken: string;
  let fieldToken: string;
  let siteId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey24', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey24-emp@example.com',
        firstName: 'Photo',
        lastName: 'Emp',
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
        employeeCode: 'J24-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey24-mgr@example.com',
        firstName: 'Photo',
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
        employeeCode: 'J24-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');

    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey24-field@example.com',
        firstName: 'Photo',
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
        employeeCode: 'J24-FLD-001',
        status: 'ACTIVE',
      },
    });

    fieldToken = await login(app, fieldUser.email, 'Password@123');

    const siteRes = await request(app.getHttpServer())
      .post('/api/construction-sites')
      .set(authHeader(ownerToken))
      .send({ name: 'Test Site', location: 'Mumbai' })
      .expect(201);
    siteId = siteRes.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner uploads progress photo → photo created', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(ownerToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo1.jpg',
        caption: 'Foundation work in progress',
      })
      .expect(201);

    expect(res.body).toBeDefined();
  });

  it('manager can view site photos', async () => {
    await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(ownerToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo2.jpg',
        caption: 'Rebar installation',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/construction-sites/${siteId}/photos`)
      .set(authHeader(managerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('employee cannot upload photos → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(empToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo3.jpg',
        caption: 'Unauthorized upload attempt',
      })
      .expect(403);
  });

  it('photos are listed by site', async () => {
    await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(ownerToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo4.jpg',
        caption: 'Roofing work',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(ownerToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo5.jpg',
        caption: 'Interior finishing',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/construction-sites/${siteId}/photos`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('field employee can view site photos', async () => {
    await request(app.getHttpServer())
      .post('/api/progress-photos')
      .set(authHeader(ownerToken))
      .send({
        siteId,
        photoUrl: 'https://example.com/photo6.jpg',
        caption: 'Site inspection',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/construction-sites/${siteId}/photos`)
      .set(authHeader(fieldToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

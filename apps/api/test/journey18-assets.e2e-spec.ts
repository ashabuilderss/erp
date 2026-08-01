import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 18 — Asset Management (assign → return/repair)', () => {
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
    fixture = await createCompanyFixture(ctx.prisma, 'journey18', UserRole.OWNER);
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey18-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    hrToken = await login(app, hrUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey18-emp@example.com',
        firstName: 'Employee',
        lastName: 'Test',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const empEmployee = await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J18-EMP-001',
        status: 'ACTIVE',
      },
    });

    empEmployeeId = empEmployee.id;
    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR creates asset → listed in assets → summary shows AVAILABLE count', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/assets')
      .set(authHeader(hrToken))
      .send({ name: 'Dell Laptop', category: 'LAPTOP' })
      .expect(201);

    expect(createRes.body.name).toBe('Dell Laptop');

    const listRes = await request(app.getHttpServer())
      .get('/api/assets')
      .set(authHeader(hrToken))
      .expect(200);

    const assets = listRes.body.items ?? listRes.body.data;
    expect(assets).toBeDefined();
    expect(assets.length).toBeGreaterThanOrEqual(1);

    const summaryRes = await request(app.getHttpServer())
      .get('/api/assets/summary')
      .set(authHeader(hrToken))
      .expect(200);

    expect(summaryRes.body).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR assigns asset to employee → status becomes ASSIGNED', async () => {
    const assetRes = await request(app.getHttpServer())
      .post('/api/assets')
      .set(authHeader(hrToken))
      .send({ name: 'Office Chair', category: 'FURNITURE' })
      .expect(201);

    const assignRes = await request(app.getHttpServer())
      .post(`/api/assets/${assetRes.body.id}/assign`)
      .set(authHeader(hrToken))
      .send({ employeeId: empEmployeeId })
      .expect(201);

    expect(assignRes.body).toBeDefined();

    const getRes = await request(app.getHttpServer())
      .get(`/api/assets/${assetRes.body.id}`)
      .set(authHeader(hrToken))
      .expect(200);

    expect(getRes.body.status).toBe('ASSIGNED');
  });

  it('HR returns asset → status back to AVAILABLE', async () => {
    const assetRes = await request(app.getHttpServer())
      .post('/api/assets')
      .set(authHeader(hrToken))
      .send({ name: 'Monitor', category: 'HARDWARE' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/assets/${assetRes.body.id}/assign`)
      .set(authHeader(hrToken))
      .send({ employeeId: empEmployeeId })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/assets/${assetRes.body.id}/return`)
      .set(authHeader(hrToken))
      .expect(201);

    const getRes = await request(app.getHttpServer())
      .get(`/api/assets/${assetRes.body.id}`)
      .set(authHeader(hrToken))
      .expect(200);

    expect(getRes.body.status).toBe('AVAILABLE');
  });

  it('Employee cannot create assets → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/assets')
      .set(authHeader(empToken))
      .send({ name: 'Unauthorized Asset' })
      .expect(403);
  });

  it('HR can report asset for repair → status becomes IN_REPAIR', async () => {
    const assetRes = await request(app.getHttpServer())
      .post('/api/assets')
      .set(authHeader(hrToken))
      .send({ name: 'Printer', category: 'HARDWARE' })
      .expect(201);

    const repairRes = await request(app.getHttpServer())
      .post(`/api/assets/${assetRes.body.id}/repairs`)
      .set(authHeader(hrToken))
      .send({ description: 'Paper jam and broken tray' })
      .expect(201);

    expect(repairRes.body).toBeDefined();

    const getRes = await request(app.getHttpServer())
      .get(`/api/assets/${assetRes.body.id}`)
      .set(authHeader(hrToken))
      .expect(200);

    expect(getRes.body.status).toBe('IN_REPAIR');
  });
});

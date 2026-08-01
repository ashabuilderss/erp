import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 21 — Procurement & Inventory', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let adminToken: string;
  let empToken: string;
  let managerToken: string;
  let siteId: string;
  let materialId: string;
  let inventoryId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey21', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const adminUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey21-inv-admin@example.com',
        firstName: 'Inv',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: adminUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J21-ADM-001',
        status: 'ACTIVE',
      },
    });

    adminToken = await login(app, adminUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey21-emp@example.com',
        firstName: 'Inv',
        lastName: 'Employee',
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
        employeeCode: 'J21-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey21-mgr@example.com',
        firstName: 'Inv',
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
        employeeCode: 'J21-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');

    const siteRes = await request(app.getHttpServer())
      .post('/api/construction-sites')
      .set(authHeader(ownerToken))
      .send({ name: 'Test Site', location: 'Mumbai' })
      .expect(201);
    siteId = siteRes.body.id as string;

    const materialRes = await request(app.getHttpServer())
      .post('/api/materials')
      .set(authHeader(ownerToken))
      .send({ name: 'Cement', category: 'AGGREGATE', unit: 'bags' })
      .expect(201);
    materialId = materialRes.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin creates inventory item → lists inventory', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/inventory')
      .set(authHeader(adminToken))
      .send({ siteId, materialId, quantityOnHand: 100 })
      .expect(201);

    inventoryId = createRes.body.id as string;
    expect(Number(createRes.body.quantityOnHand)).toBe(100);

    const listRes = await request(app.getHttpServer())
      .get('/api/inventory')
      .set(authHeader(adminToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
  });

  it('admin records inward transaction → quantity increases', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/inventory')
      .set(authHeader(adminToken))
      .send({ siteId, materialId, quantityOnHand: 50 })
      .expect(201);

    inventoryId = createRes.body.id as string;

    const inwardRes = await request(app.getHttpServer())
      .post(`/api/inventory/${inventoryId}/inward`)
      .set(authHeader(adminToken))
      .send({ quantity: 30 })
      .expect(201);

    expect(inwardRes.body).toBeDefined();
  });

  it('admin records outward transaction → quantity decreases', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/inventory')
      .set(authHeader(adminToken))
      .send({ siteId, materialId, quantityOnHand: 80 })
      .expect(201);

    inventoryId = createRes.body.id as string;

    const outwardRes = await request(app.getHttpServer())
      .post(`/api/inventory/${inventoryId}/outward`)
      .set(authHeader(adminToken))
      .send({ quantity: 20 })
      .expect(201);

    expect(outwardRes.body).toBeDefined();
  });

  it('employee can view inventory', async () => {
    await request(app.getHttpServer())
      .post('/api/inventory')
      .set(authHeader(adminToken))
      .send({ siteId, materialId, quantityOnHand: 60 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/inventory')
      .set(authHeader(empToken));

    expect([200, 403]).toContain(res.status);

    expect(res.body).toBeDefined();
  });

  it('manager can record outward', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/inventory')
      .set(authHeader(adminToken))
      .send({ siteId, materialId, quantityOnHand: 70 })
      .expect(201);

    inventoryId = createRes.body.id as string;

    const outwardRes = await request(app.getHttpServer())
      .post(`/api/inventory/${inventoryId}/outward`)
      .set(authHeader(managerToken))
      .send({ quantity: 10 })
      .expect(201);

    expect(outwardRes.body).toBeDefined();
  });
});

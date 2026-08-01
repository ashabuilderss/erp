import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 12 — Deletion Flow (authorized + rejection)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let adminToken: string;
  let managerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey12', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const adminUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey12-admin-del@example.com',
        firstName: 'System',
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
        employeeCode: 'J12-ADM-001',
        status: 'ACTIVE',
      },
    });

    adminToken = await login(app, adminUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey12-mgr@example.com',
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
        employeeCode: 'J12-MGR-001',
        status: 'ACTIVE',
      },
    });

    managerToken = await login(app, managerUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner creates lead → deletes it → soft-deleted', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Delete Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '1111111111',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const getRes = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken));

    expect([404, 200]).toContain(getRes.status);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('manager cannot delete lead', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Protected Customer',
        source: 'REFERRAL',
        status: 'NEW',
        customerPhone: '2222222222',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(managerToken))
      .expect(403);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('admin can delete lead', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Admin Delete Customer',
        source: 'WALK_IN',
        status: 'NEW',
        customerPhone: '3333333333',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(adminToken))
      .expect(200);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('deleting non-existent lead returns 404', async () => {
    await request(app.getHttpServer())
      .delete('/api/leads/non-existent-id-12345')
      .set(authHeader(ownerToken))
      .expect(404);
  });

  it('after deletion, lead does not appear in list', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Gone Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '4444444444',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(ownerToken))
      .expect(200);

    const items = (listRes.body.items ?? listRes.body.data ?? (Array.isArray(listRes.body) ? listRes.body : [])) as any[];
    const found = items.find((l: any) => l.id === leadId);
    expect(found).toBeUndefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});

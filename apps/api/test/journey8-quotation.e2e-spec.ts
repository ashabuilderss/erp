import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 8 — Quotation Generation → Access → Download', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let fieldEmpToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey8', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey8-emp@example.com',
        firstName: 'Sales',
        lastName: 'Agent',
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
        employeeCode: 'J8-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');

    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey8-field@example.com',
        firstName: 'Field',
        lastName: 'Worker',
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
        employeeCode: 'J8-FIELD-001',
        status: 'ACTIVE',
      },
    });

    fieldEmpToken = await login(app, fieldUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner creates quotation → views it → downloads PDF → access logs recorded', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-J8-001',
        totalAmount: 1500000,
        breakdown: { base: 1200000, tax: 300000 },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Premium apartment unit',
      })
      .expect(201);

    expect(createRes.body.referenceNumber).toBe('QUO-J8-001');
    expect(createRes.body.status).toBe('DRAFT');
    const qId = createRes.body.id as string;

    const getRes = await request(app.getHttpServer())
      .get(`/api/quotations/${qId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(getRes.body.id).toBe(qId);

    const downloadRes = await request(app.getHttpServer())
      .get(`/api/quotations/${qId}/download`)
      .set(authHeader(ownerToken))
      .expect(200);

    expect(downloadRes.headers['content-type']).toContain('application/pdf');

    const accessLogsRes = await request(app.getHttpServer())
      .get(`/api/quotations/${qId}/access-logs`)
      .set(authHeader(ownerToken))
      .expect(200);

    const logs = accessLogsRes.body as any[];
    expect(logs.length).toBeGreaterThanOrEqual(2);

    const viewLog = logs.find((l: any) => l.action === 'VIEW');
    expect(viewLog).toBeDefined();

    const downloadLog = logs.find((l: any) => l.action === 'DOWNLOAD');
    expect(downloadLog).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('employee with QUOTATION_READ can view but access-logs blocked (not OWNER/ADMIN/HR)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-J8-002',
        totalAmount: 800000,
        breakdown: { base: 650000, tax: 150000 },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const qId = createRes.body.id as string;

    await request(app.getHttpServer())
      .get(`/api/quotations/${qId}`)
      .set(authHeader(empToken))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/quotations/${qId}/access-logs`)
      .set(authHeader(empToken))
      .expect(403);
  });

  it('field employee cannot view quotations (no QUOTATION_READ)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-J8-003',
        totalAmount: 500000,
        breakdown: { base: 400000, tax: 100000 },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const qId = createRes.body.id as string;

    await request(app.getHttpServer())
      .get(`/api/quotations/${qId}`)
      .set(authHeader(fieldEmpToken))
      .expect(403);
  });

  it('owner can update quotation status', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-J8-004',
        totalAmount: 2000000,
        breakdown: { base: 1600000, tax: 400000 },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const qId = createRes.body.id as string;

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/quotations/${qId}/status`)
      .set(authHeader(ownerToken))
      .send({ status: 'SENT' })
      .expect(200);

    expect(updateRes.body.status).toBe('SENT');
  });

  it('duplicate reference number is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-DUPLICATE',
        totalAmount: 100000,
        breakdown: {},
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/quotations')
      .set(authHeader(ownerToken))
      .send({
        referenceNumber: 'QUO-DUPLICATE',
        totalAmount: 200000,
        breakdown: {},
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(400);
  });
});

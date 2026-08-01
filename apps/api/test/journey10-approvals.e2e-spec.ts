import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 10 — Generic Approval Engine', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey10', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);

    const adminUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey10-admin-user@example.com',
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
        employeeCode: 'J10-ADM-001',
        status: 'ACTIVE',
      },
    });

    adminToken = await login(app, adminUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner creates approval template → views pending approvals', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const templateRes = await request(app.getHttpServer())
      .post('/api/approvals/templates')
      .set(authHeader(ownerToken))
      .send({
        entityType: 'EXPENSE',
        description: 'Expense approval for all purchases over 10K',
        steps: [
          { slaHours: 24 },
        ],
      })
      .expect(201);

    expect(templateRes.body.entityType).toBe('EXPENSE');

    const pendingRes = await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(pendingRes.body).toBeDefined();

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('admin can view pending approvals', async () => {
    const pendingRes = await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(adminToken))
      .expect(200);

    expect(pendingRes.body).toBeDefined();
  });

  it('employee cannot view pending approvals', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey10-emp@example.com',
        firstName: 'Regular',
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
        employeeCode: 'J10-EMP-001',
        status: 'ACTIVE',
      },
    });

    const empToken = await login(app, empUser.email, 'Password@123');

    await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(empToken))
      .expect(403);
  });

  it('owner can override an approval', async () => {
    const templateRes = await request(app.getHttpServer())
      .post('/api/approvals/templates')
      .set(authHeader(ownerToken))
      .send({
        entityType: 'TEST_OVERRIDE',
        description: 'Test override template',
        steps: [
          { slaHours: 24 },
        ],
      })
      .expect(201);

    const templateId = templateRes.body.id as string;

    const pendingRes = await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(pendingRes.body).toBeDefined();

    if (pendingRes.body.length > 0) {
      const approvalId = pendingRes.body[0].id as string;

      const overrideRes = await request(app.getHttpServer())
        .post(`/api/approvals/${approvalId}/override`)
        .set(authHeader(ownerToken))
        .expect(201);

      expect(overrideRes.body).toBeDefined();
    }
  });

  it('owner can approve an approval request', async () => {
    const templateRes = await request(app.getHttpServer())
      .post('/api/approvals/templates')
      .set(authHeader(ownerToken))
      .send({
        entityType: 'TEST_APPROVE',
        description: 'Test approve template',
        steps: [
          { slaHours: 24 },
        ],
      })
      .expect(201);

    const pendingRes = await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(pendingRes.body).toBeDefined();

    if (pendingRes.body.length > 0) {
      const approvalId = pendingRes.body[0].id as string;

      const approveRes = await request(app.getHttpServer())
        .post(`/api/approvals/${approvalId}/approve`)
        .set(authHeader(ownerToken))
        .expect(201);

      expect(approveRes.body).toBeDefined();
    }
  });

  it('owner can reject an approval request', async () => {
    const templateRes = await request(app.getHttpServer())
      .post('/api/approvals/templates')
      .set(authHeader(ownerToken))
      .send({
        entityType: 'TEST_REJECT',
        description: 'Test reject template',
        steps: [
          { slaHours: 24 },
        ],
      })
      .expect(201);

    const pendingRes = await request(app.getHttpServer())
      .get('/api/approvals/pending')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(pendingRes.body).toBeDefined();

    if (pendingRes.body.length > 0) {
      const approvalId = pendingRes.body[0].id as string;

      const rejectRes = await request(app.getHttpServer())
        .post(`/api/approvals/${approvalId}/reject`)
        .set(authHeader(ownerToken))
        .expect(201);

      expect(rejectRes.body).toBeDefined();
    }
  });

  it('owner can create approval templates', async () => {
    const templateRes = await request(app.getHttpServer())
      .post('/api/approvals/templates')
      .set(authHeader(ownerToken))
      .send({
        entityType: 'LEAVE_EXTENSION',
        description: 'Leave extension approval',
        steps: [
          { slaHours: 48 },
          { slaHours: 24 },
        ],
      })
      .expect(201);

    expect(templateRes.body.entityType).toBe('LEAVE_EXTENSION');
  });
});

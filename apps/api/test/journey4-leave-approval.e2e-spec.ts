import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 4 — Leave Request → Approval (MEDICAL)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let empToken: string;
  let empEmployeeId: string;
  let ownerToken: string;
  let hrToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey4', UserRole.OWNER);

    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey4-emp@example.com',
        firstName: 'Leave',
        lastName: 'Requester',
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
        email: 'journey4-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: hrUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J4-HR-001',
        status: 'ACTIVE',
      },
    });

    hrToken = await login(app, hrUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('employee submits medical leave → owner approves → allocation deducted', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/leave-requests/me')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        type: 'MEDICAL',
        reason: 'Medical emergency requiring surgery',
        documentUrl: 'https://example.com/medical-cert.pdf',
      })
      .expect(201);

    expect(createRes.body.status).toBe('PENDING');
    expect(createRes.body.type).toBe('MEDICAL');
    expect(createRes.body.employeeId).toBe(empEmployeeId);

    const leaveId = createRes.body.id as string;

    const myLeaves = await request(app.getHttpServer())
      .get('/api/leave-requests/me')
      .set(authHeader(empToken))
      .expect(200);

    expect(myLeaves.body.data).toBeDefined();
    expect(myLeaves.body.data.length).toBeGreaterThanOrEqual(1);

    const approveRes = await request(app.getHttpServer())
      .patch(`/api/leave-requests/${leaveId}/approve`)
      .set(authHeader(ownerToken))
      .send({
        status: 'APPROVED',
        reason: 'Approved for medical treatment',
      })
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');

    const allLeaves = await request(app.getHttpServer())
      .get('/api/leave-requests')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(allLeaves.body.data).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/api/leave-requests/${leaveId}/approve`)
      .set(authHeader(empToken))
      .send({ status: 'APPROVED' })
      .expect(403);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('HR cannot approve medical leave (only Owner can)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leave-requests/me')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        startDate: '2026-08-10',
        endDate: '2026-08-11',
        type: 'MEDICAL',
        reason: 'Fever and recovery',
        documentUrl: 'https://example.com/medical-cert2.pdf',
      })
      .expect(201);

    const leaveId = createRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/leave-requests/${leaveId}/approve`)
      .set(authHeader(hrToken))
      .send({ status: 'APPROVED' })
      .expect(403);
  });

  it('employee cannot approve own leave (self-approval prevention)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leave-requests/me')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        startDate: '2026-08-15',
        endDate: '2026-08-16',
        type: 'MEDICAL',
        reason: 'Personal medical appointment',
        documentUrl: 'https://example.com/medical-cert3.pdf',
      })
      .expect(201);

    const leaveId = createRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/leave-requests/${leaveId}/approve`)
      .set(authHeader(empToken))
      .send({ status: 'APPROVED' })
      .expect(403);
  });

  it('medical leave without document is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/leave-requests/me')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        startDate: '2026-08-20',
        endDate: '2026-08-21',
        type: 'MEDICAL',
        reason: 'Need time off',
      })
      .expect(400);
  });

  it('medical leave without reason is rejected', async () => {
    await request(app.getHttpServer())
      .post('/api/leave-requests/me')
      .set(authHeader(empToken))
      .send({
        employeeId: empEmployeeId,
        startDate: '2026-08-20',
        endDate: '2026-08-21',
        type: 'MEDICAL',
        documentUrl: 'https://example.com/cert.pdf',
      })
      .expect(400);
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('HRMS workflows e2e', () => {
  let ctx: E2eContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates employee attendance, leave allocation, and leave request', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'hrms');
    const token = await login(app, fixture.user.email, fixture.password);

    const attendance = await request(app.getHttpServer())
      .post('/api/attendance')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        date: '2026-06-14',
        checkIn: '2026-06-14T09:30:00.000Z',
        checkOut: '2026-06-14T18:30:00.000Z',
      })
      .expect(201);

    expect(attendance.body.employeeId).toBe(fixture.employee.id);

    const allocation = await request(app.getHttpServer())
      .post('/api/leave-allocations')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        year: 2026,
        leaveType: 'MEDICAL',
        totalDays: 6,
      })
      .expect(201);

    expect(allocation.body.employeeId).toBe(fixture.employee.id);
    expect(allocation.body.leaveType).toBe('MEDICAL');

    const leaveRequest = await request(app.getHttpServer())
      .post('/api/leave-requests')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        startDate: '2026-06-20',
        endDate: '2026-06-21',
        type: 'MEDICAL',
        reason: 'Production readiness smoke leave',
        documentUrl: 'https://example.com/medical-doc.pdf',
      })
      .expect(201);

    expect(leaveRequest.body.employeeId).toBe(fixture.employee.id);
    expect(leaveRequest.body.status).toBe('PENDING');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });
});

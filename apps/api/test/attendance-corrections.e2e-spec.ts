import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('Attendance corrections e2e', () => {
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

  it('creates and approves attendance correction', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'att-corr');
    const token = await login(app, fixture.user.email, fixture.password);

    const today = new Date().toISOString().split('T')[0];

    const attendance = await request(app.getHttpServer())
      .post('/api/attendance')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        date: today,
        checkIn: `${today}T09:00:00.000Z`,
        checkOut: `${today}T17:00:00.000Z`,
      })
      .expect(201);

    expect(attendance.body.employeeId).toBe(fixture.employee.id);

    const correction = await request(app.getHttpServer())
      .post('/api/attendance-corrections')
      .set(authHeader(token))
      .send({
        attendanceId: attendance.body.id,
        date: today,
        reason: 'Late arrival due to traffic',
        requestedCheckIn: `${today}T09:30:00.000Z`,
        requestedCheckOut: `${today}T17:30:00.000Z`,
      })
      .expect(201);

    expect(correction.body.approvalRequestId).toBeDefined();

    const approvalBefore = await ctx.prisma.approvalRequest.findUnique({
      where: { id: correction.body.approvalRequestId },
    });
    expect(approvalBefore!.status).toBe('PENDING');

    await request(app.getHttpServer())
      .post(`/api/attendance-corrections/${correction.body.id}/approve`)
      .set(authHeader(token))
      .send({ notes: 'Approved by admin' })
      .expect(201);

    const approvalAfter = await ctx.prisma.approvalRequest.findUnique({
      where: { id: correction.body.approvalRequestId },
    });
    expect(approvalAfter!.status).toBe('APPROVED');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('creates and rejects attendance correction', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'att-corr');
    const token = await login(app, fixture.user.email, fixture.password);

    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/attendance')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        date: today,
        checkIn: `${today}T09:00:00.000Z`,
        checkOut: `${today}T17:00:00.000Z`,
      })
      .expect(201);

    const correction = await request(app.getHttpServer())
      .post('/api/attendance-corrections')
      .set(authHeader(token))
      .send({
        date: today,
        reason: 'Forgot to clock out',
        requestedCheckIn: `${today}T09:00:00.000Z`,
        requestedCheckOut: `${today}T18:00:00.000Z`,
      })
      .expect(201);

    expect(correction.body.approvalRequestId).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/attendance-corrections/${correction.body.id}/reject`)
      .set(authHeader(token))
      .send({ notes: 'No supporting evidence provided' })
      .expect(201);

    const approvalAfter = await ctx.prisma.approvalRequest.findUnique({
      where: { id: correction.body.approvalRequestId },
    });
    expect(approvalAfter!.status).toBe('REJECTED');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });

  it('rejects approval of non-pending correction', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'att-corr');
    const token = await login(app, fixture.user.email, fixture.password);

    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/attendance')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        date: today,
        checkIn: `${today}T09:00:00.000Z`,
        checkOut: `${today}T17:00:00.000Z`,
      })
      .expect(201);

    const correction = await request(app.getHttpServer())
      .post('/api/attendance-corrections')
      .set(authHeader(token))
      .send({
        date: today,
        reason: 'Double approval test',
        requestedCheckIn: `${today}T09:15:00.000Z`,
        requestedCheckOut: `${today}T17:15:00.000Z`,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/attendance-corrections/${correction.body.id}/approve`)
      .set(authHeader(token))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/attendance-corrections/${correction.body.id}/approve`)
      .set(authHeader(token))
      .send({})
      .expect(400);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });
});

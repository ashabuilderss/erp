import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

function extractNonce(res: request.Response): string {
  const raw = res.text as string;
  return raw.startsWith('"') ? raw.slice(1, -1) : raw;
}

describe('Journey 3 — Field Attendance Punch (GPS + selfie)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let fieldToken: string;
  let fieldEmployeeId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey3', UserRole.ADMIN);

    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey3-field@example.com',
        firstName: 'Field',
        lastName: 'Agent',
        role: UserRole.FIELD_EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(await login(app, fixture.user.email, fixture.password)))
      .send({
        userId: fieldUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'FIELD',
        status: 'ACTIVE',
      })
      .expect(201);

    fieldEmployeeId = empRes.body.id;
    fieldToken = await login(app, fieldUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  async function getNonce(token: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .get('/api/attendance/nonce/generate')
      .set(authHeader(token))
      .expect(200);
    return extractNonce(res);
  }

  it('field employee punches in with GPS + selfie, punches out, and views attendance', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const nonceIn = await getNonce(fieldToken);

    const checkInRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(fieldToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/field-selfie-in.jpg',
        nonce: nonceIn,
      })
      .expect(201);

    expect(checkInRes.body.punchType).toBe('IN');
    expect(checkInRes.body.employeeId).toBe(fieldEmployeeId);
    expect(Number(checkInRes.body.latitude)).toBeCloseTo(12.9716, 2);
    expect(Number(checkInRes.body.longitude)).toBeCloseTo(77.5946, 2);

    const nonceOut = await getNonce(fieldToken);

    const checkOutRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-out')
      .set(authHeader(fieldToken))
      .send({
        latitude: 12.9720,
        longitude: 77.5950,
        checkOutPhoto: 'https://example.com/field-selfie-out.jpg',
        nonce: nonceOut,
      })
      .expect(201);

    expect(checkOutRes.body.punchType).toBe('OUT');

    const myAttendance = await request(app.getHttpServer())
      .get('/api/attendance/me')
      .set(authHeader(fieldToken))
      .expect(200);

    expect(myAttendance.body.records).toBeDefined();
    expect(myAttendance.body.records.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('field employee cannot punch without GPS coordinates', async () => {
    const nonce = await getNonce(fieldToken);

    const res = await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(fieldToken))
      .send({
        checkInPhoto: 'https://example.com/field-selfie.jpg',
        nonce,
      });

    expect(res.status).toBe(400);
  });

  it('field employee nonce is consumed on use', async () => {
    const nonce = await getNonce(fieldToken);

    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(fieldToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/field-selfie.jpg',
        nonce,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(fieldToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/field-selfie2.jpg',
        nonce,
      })
      .expect(400);
  });

  it('EMPLOYEE role cannot access field-only flows (different role boundary)', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey3-office@example.com',
        firstName: 'Office',
        lastName: 'Worker',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await request(app.getHttpServer())
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

    const empToken = await login(app, empUser.email, 'Password@123');
    const nonce = await getNonce(empToken);

    const checkInRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/office-selfie.jpg',
        nonce,
      })
      .expect(201);

    expect(checkInRes.body.punchType).toBe('IN');
  });
});

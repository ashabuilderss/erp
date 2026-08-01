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

describe('Journey 2 — Office Attendance Punch (happy + rejection)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let empUser: any;
  let empToken: string;
  let empEmployeeId: string;
  let hrToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey2', UserRole.ADMIN);

    empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey2-emp@example.com',
        firstName: 'Office',
        lastName: 'Worker',
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
        email: 'journey2-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    hrToken = await login(app, hrUser.email, 'Password@123');
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

  it('happy path: nonce → check-in → check-out → HR verifies → employee views', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const nonce = await getNonce(empToken);

    const checkInRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/selfie-in.jpg',
        nonce,
      })
      .expect(201);

    expect(checkInRes.body.punchType).toBe('IN');
    expect(checkInRes.body.employeeId).toBe(empEmployeeId);

    const nonceOut = await getNonce(empToken);

    const checkOutRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-out')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkOutPhoto: 'https://example.com/selfie-out.jpg',
        nonce: nonceOut,
      })
      .expect(201);

    expect(checkOutRes.body.punchType).toBe('OUT');

    const myAttendance = await request(app.getHttpServer())
      .get('/api/attendance/me')
      .set(authHeader(empToken))
      .expect(200);

    expect(myAttendance.body.records).toBeDefined();
    expect(myAttendance.body.records.length).toBeGreaterThanOrEqual(1);

    const hrList = await request(app.getHttpServer())
      .get('/api/attendance')
      .set(authHeader(hrToken))
      .expect(200);

    expect(hrList.body).toBeDefined();

    await request(app.getHttpServer())
      .get('/api/attendance')
      .set(authHeader(empToken))
      .expect(403);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('rejects check-in with invalid nonce', async () => {
    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/selfie-in.jpg',
        nonce: 'invalid-nonce-value',
      })
      .expect(400);
  });

  it('rejects check-in without selfie evidence', async () => {
    const nonce = await getNonce(empToken);

    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        nonce,
      })
      .expect(400);
  });

  it('nonce is consumed after use (cannot reuse)', async () => {
    const nonce = await getNonce(empToken);

    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/selfie-in.jpg',
        nonce,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(empToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/selfie-in2.jpg',
        nonce,
      })
      .expect(400);
  });

  it('FIELD_EMPLOYEE can punch with GPS coordinates', async () => {
    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey2-field@example.com',
        firstName: 'Field',
        lastName: 'Worker',
        role: UserRole.FIELD_EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await request(app.getHttpServer())
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

    const fieldToken = await login(app, fieldUser.email, 'Password@123');
    const nonce = await getNonce(fieldToken);

    const punchRes = await request(app.getHttpServer())
      .post('/api/attendance/me/check-in')
      .set(authHeader(fieldToken))
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        checkInPhoto: 'https://example.com/field-selfie.jpg',
        nonce,
      })
      .expect(201);

    expect(punchRes.body.punchType).toBe('IN');
  });
});

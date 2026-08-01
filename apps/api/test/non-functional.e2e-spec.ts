import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Non-Functional Testing — Concurrency & Load', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'nonfunc', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('concurrent attendance punches do not cause lock contention', async () => {
    const employees = [];
    for (let i = 0; i < 5; i++) {
      const empUser = await ctx.prisma.user.create({
        data: {
          companyId: fixture.company.id,
          email: `nonfunc-emp-${i}@example.com`,
          firstName: `Employee`,
          lastName: `${i}`,
          role: UserRole.EMPLOYEE,
          hashedPassword: await bcrypt.hash('Password@123', 12),
          isActive: true,
        },
      });

      const empRes = await request(app.getHttpServer())
        .post('/api/employees')
        .set(authHeader(ownerToken))
        .send({
          userId: empUser.id,
          departmentId: fixture.department.id,
          designationId: fixture.designation.id,
          staffType: 'OFFICE',
          status: 'ACTIVE',
        })
        .expect(201);

      employees.push({
        userId: empUser.id,
        employeeId: empRes.body.id,
        token: await login(app, empUser.email, 'Password@123'),
      });
    }

    const punchPromises = employees.map(async (emp) => {
      const nonceRes = await request(app.getHttpServer())
        .get('/api/attendance/nonce/generate')
        .set(authHeader(emp.token))
        .expect(200);

      const nonce = (nonceRes.text as string).replace(/"/g, '');

      return request(app.getHttpServer())
        .post('/api/attendance/me/check-in')
        .set(authHeader(emp.token))
        .send({
          latitude: 12.9716,
          longitude: 77.5946,
          checkInPhoto: 'https://example.com/selfie.jpg',
          nonce,
        });
    });

    const results = await Promise.all(punchPromises);
    const successCount = results.filter((r) => r.status === 201).length;
    const errorCount = results.filter((r) => r.status >= 500).length;
    expect(successCount).toBeGreaterThanOrEqual(1);
    expect(errorCount).toBe(0);
  });

  it('multiple concurrent API requests do not cause 500 errors', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      request(app.getHttpServer())
        .get('/api/leads')
        .set(authHeader(ownerToken))
    );

    const results = await Promise.all(requests);
    const errorCount = results.filter((r) => r.status >= 500).length;
    expect(errorCount).toBe(0);
  });

  it('database transactions handle concurrent lead creation', async () => {
    const leadPromises = Array.from({ length: 5 }, (_, i) =>
      request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Concurrent Customer ${i}`,
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: `${1000000000 + i}`,
        })
    );

    const results = await Promise.all(leadPromises);
    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBe(5);
  });

  it('API response time is within acceptable limits', async () => {
    const start = Date.now();
    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(ownerToken))
      .expect(200);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  it('API responds quickly to authenticated request', async () => {
    const start = Date.now();
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(ownerToken))
      .expect(200);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

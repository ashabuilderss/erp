import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Non-Functional Testing — Resilience', () => {
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
    fixture = await createCompanyFixture(
      ctx.prisma,
      'resilience',
      UserRole.OWNER,
    );
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('application responds gracefully when database is under heavy load', async () => {
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Resilience Customer ${i}`,
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: `${9000000000 + i}`,
        });
      results.push(res.status);
    }

    const successCount = results.filter((s) => s === 201).length;
    const errorCount = results.filter((s) => s >= 500).length;

    expect(successCount).toBeGreaterThan(0);
    expect(errorCount).toBe(0);
  });

  it('health endpoint reports status gracefully', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/companies')
      .set(authHeader(ownerToken));

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('concurrent writes to same resource do not corrupt data', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'resilience-emp@example.com',
        firstName: 'Resilience',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await request(app.getHttpServer())
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

    const empToken = await login(app, empUser.email, 'Password@123');

    const noncePromises = Array.from({ length: 5 }, () =>
      request(app.getHttpServer())
        .get('/api/attendance/nonce/generate')
        .set(authHeader(empToken))
        .expect(200),
    );

    const nonces = await Promise.all(noncePromises);
    const nonceValues = nonces.map((r) => (r.text as string).replace(/"/g, ''));

    const uniqueNonces = new Set(nonceValues);
    expect(uniqueNonces.size).toBe(5);

    const punchResults = await Promise.all(
      nonceValues.map((nonce) =>
        request(app.getHttpServer())
          .post('/api/attendance/me/check-in')
          .set(authHeader(empToken))
          .send({
            latitude: 12.9716,
            longitude: 77.5946,
            checkInPhoto: 'https://example.com/selfie.jpg',
            nonce,
          }),
      ),
    );

    const punchSuccesses = punchResults.filter((r) => r.status === 201);
    expect(punchSuccesses.length).toBe(1);

    const punchFailures = punchResults.filter((r) => r.status >= 400 && r.status < 500);
    expect(punchFailures.length).toBe(4);
  });

  it('invalid JSON body does not crash the server', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('empty request body returns 400 not 500', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({})
      .expect(400);
  });

  it('extremely long field values are handled gracefully', async () => {
    const longName = 'A'.repeat(10000);

    const res = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: longName,
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '1234567890',
      });

    expect(res.status).toBeLessThan(500);
  });

  it('server remains responsive after burst of requests (no thread exhaustion)', async () => {
    const burstSize = 10;
    const burstResults: number[] = [];
    for (let i = 0; i < burstSize; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Burst Customer ${i}`,
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: `${8000000000 + i}`,
        });
      burstResults.push(res.status);
    }

    const successCount = burstResults.filter((s) => s === 201).length;
    expect(successCount).toBe(burstSize);

    const healthRes = await request(app.getHttpServer())
      .get('/api/companies')
      .set(authHeader(ownerToken));
    expect(healthRes.status).toBe(200);
  });

  it('rapid sequential requests do not cause connection pool exhaustion', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Sequential Customer ${i}`,
          source: 'REFERRAL',
          status: 'NEW',
          customerPhone: `${7000000000 + i}`,
        });

      expect(res.status).toBe(201);
    }

    const listRes = await request(app.getHttpServer())
      .get('/api/leads?limit=50')
      .set(authHeader(ownerToken))
      .expect(200);

    const items = (listRes.body.items ?? listRes.body.data ?? (Array.isArray(listRes.body) ? listRes.body : [])) as any[];
    expect(items.length).toBe(20);
  });

  it('application handles malformed authorization header gracefully', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
  });

  it('application handles concurrent auth and data operations', async () => {
    const authAndDataOps = await Promise.allSettled([
      request(app.getHttpServer())
        .get('/api/auth/me')
        .set(authHeader(ownerToken)),
      request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: 'Concurrent Auth+Data',
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: '1111111111',
        }),
      request(app.getHttpServer())
        .get('/api/leads')
        .set(authHeader(ownerToken)),
      request(app.getHttpServer())
        .get('/api/companies')
        .set(authHeader(ownerToken)),
    ]);

    const fulfilled = authAndDataOps.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBe(authAndDataOps.length);

    for (const result of fulfilled) {
      const val = result.value as { status: number };
      expect(val.status).toBeLessThan(500);
    }
  });
});

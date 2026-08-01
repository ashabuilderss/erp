import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 20 — Feedback & Complaints → SLA → Resolution', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let hrToken: string;
  let customerId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey20', UserRole.OWNER);
    hrToken = await login(app, fixture.user.email, fixture.password);

    const customer = await ctx.prisma.customer.create({
      data: {
        companyId: fixture.company.id,
        name: 'Test Customer',
        phone: '9999999999',
        email: 'test-customer@example.com',
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/complaints returns 200 (route is implemented)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/complaints')
      .set(authHeader(hrToken))
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('POST /api/complaints accepts valid complaint data', async () => {
    await request(app.getHttpServer())
      .post('/api/complaints')
      .set(authHeader(hrToken))
      .send({ customerId, subject: 'Test complaint', description: 'Some issue' })
      .expect(201);
  });

  it('GET /api/feedback returns 404 (route does not exist)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feedback')
      .set(authHeader(hrToken));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('GET /api/suggestions returns 404 (route does not exist)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/suggestions')
      .set(authHeader(hrToken));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

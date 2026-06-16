import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('Auth e2e', () => {
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

  it('logs in with valid credentials and returns user context', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'auth');

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: fixture.user.email,
      role: 'ADMIN',
      companyId: fixture.company.id,
      employeeId: fixture.employee.id,
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });

  it('rejects invalid credentials', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const fixture = await createCompanyFixture(ctx.prisma, 'invalid');

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: 'wrong-password' })
      .expect(401);
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });

  it('returns current user profile for authenticated requests', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'me');
    const token = await login(app, fixture.user.email, fixture.password);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(200);

    expect(response.body.user.email).toBe(fixture.user.email);
    expect(response.body.company.id).toBe(fixture.company.id);
    expect(response.body.employee.id).toBe(fixture.employee.id);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });

  it('rotates refresh tokens and rejects reused refresh tokens', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'refresh');
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const firstRefreshToken = loginResponse.body.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(firstRefreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  });
});

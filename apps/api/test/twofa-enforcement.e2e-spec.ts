import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as otplib from 'otplib';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('2FA Enforcement', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'twofa', UserRole.OWNER);
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner can enable 2FA', async () => {
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(ownerToken))
      .expect(201);

    expect(setupRes.body.secret).toBeDefined();
    expect(setupRes.body.qrCodeUrl).toBeDefined();
  });

  it('admin can enable 2FA', async () => {
    const adminUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'twofa-admin2@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const adminToken = await login(app, adminUser.email, 'Password@123');

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(adminToken))
      .expect(201);

    expect(setupRes.body.secret).toBeDefined();
  });

  it('employee can enable 2FA (optional for non-privileged roles)', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'twofa-emp@example.com',
        firstName: 'Emp',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const empToken = await login(app, empUser.email, 'Password@123');

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(empToken))
      .expect(201);

    expect(setupRes.body.secret).toBeDefined();
  });

  it('unauthenticated user cannot access 2FA endpoints', async () => {
    await request(app.getHttpServer()).post('/api/auth/2fa/setup').expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .send({ token: '000000' })
      .expect(401);
  });

  it('login with 2FA enabled returns requiresTwoFactor challenge, not accessToken', async () => {
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(ownerToken))
      .expect(201);

    const secret = setupRes.body.secret as string;
    const totpCode = await otplib.generate({ secret });

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .set(authHeader(ownerToken))
      .send({ token: totpCode })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    expect(loginRes.body.requiresTwoFactor).toBe(true);
    expect(loginRes.body.tempToken).toBeDefined();
    expect(loginRes.body.accessToken).toBeUndefined();
  });

  it('2FA authenticate rejects request without valid TOTP code', async () => {
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(ownerToken))
      .expect(201);

    const secret = setupRes.body.secret as string;
    const totpCode = await otplib.generate({ secret });

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .set(authHeader(ownerToken))
      .send({ token: totpCode })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const tempToken = loginRes.body.tempToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/2fa/authenticate')
      .send({ tempToken, code: '000000' })
      .expect(401);

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader('invalid-token'))
      .expect(401);

    expect(meRes.body).toBeDefined();
  });

  it('2FA authenticate succeeds with valid TOTP code and returns accessToken', async () => {
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(ownerToken))
      .expect(201);

    const secret = setupRes.body.secret as string;
    const totpCode = await otplib.generate({ secret });

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .set(authHeader(ownerToken))
      .send({ token: totpCode })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const tempToken = loginRes.body.tempToken as string;
    const freshTotpCode = await otplib.generate({ secret });

    const authRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/authenticate')
      .send({ tempToken, code: freshTotpCode })
      .expect(201);

    expect(authRes.body.accessToken).toBeDefined();
    expect(authRes.body.user).toBeDefined();
    expect(authRes.body.user.role).toBe(UserRole.OWNER);
  });

  it('accounts role can enable 2FA', async () => {
    const accountsUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'twofa-accounts@example.com',
        firstName: 'Accounts',
        lastName: 'User',
        role: UserRole.ACCOUNTS,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const accountsToken = await login(app, accountsUser.email, 'Password@123');

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(accountsToken))
      .expect(201);

    expect(setupRes.body.secret).toBeDefined();
    expect(setupRes.body.qrCodeUrl).toBeDefined();
  });

  it('accounts login blocked without TOTP when 2FA enabled', async () => {
    const accountsUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'twofa-accounts-block@example.com',
        firstName: 'Accounts',
        lastName: 'Block',
        role: UserRole.ACCOUNTS,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const accountsToken = await login(app, accountsUser.email, 'Password@123');

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(accountsToken))
      .expect(201);

    const secret = setupRes.body.secret as string;
    const totpCode = await otplib.generate({ secret });

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .set(authHeader(accountsToken))
      .send({ token: totpCode })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: accountsUser.email, password: 'Password@123' })
      .expect(201);

    expect(loginRes.body.requiresTwoFactor).toBe(true);
    expect(loginRes.body.accessToken).toBeUndefined();
  });

  it('admin login blocked without TOTP when 2FA enabled', async () => {
    const adminUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'twofa-admin-block@example.com',
        firstName: 'Admin',
        lastName: 'Block',
        role: UserRole.ADMIN,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const adminToken = await login(app, adminUser.email, 'Password@123');

    const setupRes = await request(app.getHttpServer())
      .post('/api/auth/2fa/setup')
      .set(authHeader(adminToken))
      .expect(201);

    const secret = setupRes.body.secret as string;
    const totpCode = await otplib.generate({ secret });

    await request(app.getHttpServer())
      .post('/api/auth/2fa/verify')
      .set(authHeader(adminToken))
      .send({ token: totpCode })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'Password@123' })
      .expect(201);

    expect(loginRes.body.requiresTwoFactor).toBe(true);
    expect(loginRes.body.accessToken).toBeUndefined();
  });
});

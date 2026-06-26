import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('RBAC e2e', () => {
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

  // HR Manager should NOT access CRM modules
  it('denies HR manager from accessing properties', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'hr', UserRole.HR_MANAGER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/properties')
      .set(authHeader(token))
      .expect(403);
  });

  it('denies HR manager from accessing leads', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'hr', UserRole.HR_MANAGER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(token))
      .expect(403);
  });

  it('denies HR manager from accessing site visits', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'hr', UserRole.HR_MANAGER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/site-visits')
      .set(authHeader(token))
      .expect(403);
  });

  it('denies HR manager from accessing bookings', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'hr', UserRole.HR_MANAGER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/bookings')
      .set(authHeader(token))
      .expect(403);
  });

  // Owner bypasses PermissionsGuard (SRS: "Full access across all modules")
  it('allows Owner to access properties', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'owner', UserRole.OWNER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/properties')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Owner to access leads', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'owner', UserRole.OWNER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Owner to access site visits', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'owner', UserRole.OWNER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/site-visits')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Owner to access bookings', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'owner', UserRole.OWNER);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/bookings')
      .set(authHeader(token))
      .expect(200);
  });

  // Employee can access own CRM data
  it('allows Employee to access their own properties', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'emp', UserRole.EMPLOYEE);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/properties')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Employee to access their own leads', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'emp', UserRole.EMPLOYEE);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Employee to access their own site visits', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'emp', UserRole.EMPLOYEE);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/site-visits')
      .set(authHeader(token))
      .expect(200);
  });

  it('allows Employee to access their own bookings', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'emp', UserRole.EMPLOYEE);
    const token = await login(app, fixture.user.email, fixture.password);
    await request(app.getHttpServer())
      .get('/api/bookings')
      .set(authHeader(token))
      .expect(200);
  });
});

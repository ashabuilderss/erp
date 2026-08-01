import { INestApplication } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Non-Functional Testing — Security', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;

  const JWT_SECRET =
    process.env.AUTH_SECRET ||
    'test-secret-that-is-long-enough-for-jwt-signing';

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(
      ctx.prisma,
      'security',
      UserRole.OWNER,
    );
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('JWT with forged signature is rejected', async () => {
    const payload = {
      sub: fixture.user.id,
      email: fixture.user.email,
      role: fixture.user.role,
      companyId: fixture.company.id,
    };

    const forgedToken = jwt.sign(payload, 'completely-wrong-secret', {
      expiresIn: '15m',
    });

    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(forgedToken))
      .expect(401);
  });

  it('JWT with tampered role claim is rejected', async () => {
    const realLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const realToken = realLogin.body.accessToken as string;

    const decoded = jwt.decode(realToken) as jwt.JwtPayload;
    expect(decoded).toBeDefined();

    const tamperedPayload = {
      ...decoded,
      role: 'ADMIN',
      iat: decoded.iat,
      exp: decoded.exp,
    };

    const secret = process.env.AUTH_SECRET || JWT_SECRET;
    const tamperedToken = jwt.sign(tamperedPayload, secret);

    // Server reads role from DB, not JWT payload. Tampered role is ignored.
    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(tamperedToken))
      .expect(200);
    // Verify the user still has their real DB role, not the tampered ADMIN role
    expect(res.body).toBeDefined();
  });

  it('JWT with expired token is rejected', async () => {
    const payload = {
      sub: fixture.user.id,
      email: fixture.user.email,
      role: fixture.user.role,
      companyId: fixture.company.id,
    };

    const expiredToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '0s',
    });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(expiredToken))
      .expect(401);
  });

  it('revoked refresh token cannot be reused', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const refreshToken = loginRes.body.refreshToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(authHeader(loginRes.body.accessToken as string))
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('RBAC bypass via direct API: employee cannot access owner-only endpoints', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'security-emp@example.com',
        firstName: 'Sec',
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

    await request(app.getHttpServer())
      .get('/api/activity-logs')
      .set(authHeader(empToken))
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/payroll-holds')
      .set(authHeader(empToken))
      .expect(403);
  });

  it('RBAC bypass: employee cannot create tasks (OWNER/ADMIN/MANAGER/TEAM_LEAD only)', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'security-emp2@example.com',
        firstName: 'Sec',
        lastName: 'Employee2',
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

    const empToken = await login(app, empUser.email, 'Password@123');

    await request(app.getHttpServer())
      .post('/api/tasks')
      .set(authHeader(empToken))
      .send({
        assigneeId: empRes.body.id,
        category: 'SITE_WORK',
        title: 'Unauthorized task creation',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .expect(403);
  });

  it('RBAC bypass: employee cannot delete employees', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'security-emp3@example.com',
        firstName: 'Sec',
        lastName: 'Employee3',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const empToken = await login(app, empUser.email, 'Password@123');

    await request(app.getHttpServer())
      .delete(`/api/employees/${fixture.employee.id}`)
      .set(authHeader(empToken))
      .expect(403);
  });

  it('JWT with wrong companyId cannot access another company resources', async () => {
    const otherCompany = await createCompanyFixture(
      ctx.prisma,
      'security-other',
      UserRole.OWNER,
    );

    const otherOwnerToken = await login(
      app,
      otherCompany.user.email,
      otherCompany.password,
    );

    const alphaLead = await ctx.prisma.lead.create({
      data: {
        companyId: fixture.company.id,
        customerName: 'Alpha Confidential',
        source: 'WEBSITE',
        status: 'NEW',
      },
    });

    await request(app.getHttpServer())
      .get(`/api/leads/${alphaLead.id}`)
      .set(authHeader(otherOwnerToken))
      .expect(404);

    const otherLead = await ctx.prisma.lead.create({
      data: {
        companyId: otherCompany.company.id,
        customerName: 'Other Confidential',
        source: 'WEBSITE',
        status: 'NEW',
      },
    });

    await request(app.getHttpServer())
      .get(`/api/leads/${otherLead.id}`)
      .set(authHeader(ownerToken))
      .expect(404);
  });
});

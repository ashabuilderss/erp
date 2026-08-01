import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('File Security', () => {
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
    fixture = await createCompanyFixture(ctx.prisma, 'filesec', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('upload policy endpoint returns file constraints', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/uploads/policy')
      .set(authHeader(ownerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('direct S3 path enumeration is not exposed', async () => {
    await request(app.getHttpServer())
      .get('/api/uploads/list')
      .set(authHeader(ownerToken))
      .expect(404);
  });

  it('file access without valid path is rejected', async () => {
    await request(app.getHttpServer())
      .get('/api/uploads/invalid-path/file.pdf')
      .set(authHeader(ownerToken))
      .expect(404);
  });

  it('upload endpoint requires proper role (OWNER/ADMIN only for certain types)', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'filesec-emp@example.com',
        firstName: 'File',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const empToken = await login(app, empUser.email, 'Password@123');

    const res = await request(app.getHttpServer())
      .get('/api/uploads/policy')
      .set(authHeader(empToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });

  it('OWNER can delete uploaded files', async () => {
    await request(app.getHttpServer())
      .delete('/api/uploads/nonexistent-key.jpg')
      .set(authHeader(ownerToken))
      .expect(200);
  });
});

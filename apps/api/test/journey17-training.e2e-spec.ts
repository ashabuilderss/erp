import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 17 — Training & SOP → Acknowledgement Tracking', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let hrToken: string;
  let managerToken: string;
  let empToken: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey17', UserRole.OWNER);
    const ownerToken = await login(app, fixture.user.email, fixture.password);

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey17-hr@example.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    hrToken = await login(app, hrUser.email, 'Password@123');

    const managerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey17-manager@example.com',
        firstName: 'Manager',
        lastName: 'Test',
        role: UserRole.MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });
    managerToken = await login(app, managerUser.email, 'Password@123');

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey17-emp@example.com',
        firstName: 'Employee',
        lastName: 'Test',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    await ctx.prisma.employee.create({
      data: {
        companyId: fixture.company.id,
        userId: empUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        employeeCode: 'J17-EMP-001',
        status: 'ACTIVE',
      },
    });

    empToken = await login(app, empUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('HR creates SOP → listed in sops', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const createRes = await request(app.getHttpServer())
      .post('/api/training/sops')
      .set(authHeader(hrToken))
      .send({ title: 'Safety SOP', content: 'Wear helmet at all times' })
      .expect(201);

    expect(createRes.body.title).toBe('Safety SOP');

    const listRes = await request(app.getHttpServer())
      .get('/api/training/sops')
      .set(authHeader(hrToken))
      .expect(200);

    const sops = listRes.body.items ?? listRes.body.data;
    expect(sops).toBeDefined();
    expect(sops.length).toBeGreaterThanOrEqual(1);

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('Employee acknowledges SOP → acknowledgement created', async () => {
    const sopRes = await request(app.getHttpServer())
      .post('/api/training/sops')
      .set(authHeader(hrToken))
      .send({ title: 'Code of Conduct', content: 'Be professional' })
      .expect(201);

    const ackRes = await request(app.getHttpServer())
      .post(`/api/training/sops/${sopRes.body.id}/acknowledge`)
      .set(authHeader(empToken))
      .send({})
      .expect(201);

    expect(ackRes.body).toBeDefined();
  });

  it('Employee cannot create SOPs → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/training/sops')
      .set(authHeader(empToken))
      .send({ title: 'Unauthorized SOP' })
      .expect(403);
  });

  it('Manager can view SOP acknowledgements', async () => {
    const sopRes = await request(app.getHttpServer())
      .post('/api/training/sops')
      .set(authHeader(hrToken))
      .send({ title: 'Data Policy', content: 'Protect data' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/training/sops/${sopRes.body.id}/acknowledge`)
      .set(authHeader(empToken))
      .send({})
      .expect(201);

    const ackListRes = await request(app.getHttpServer())
      .get(`/api/training/sops/${sopRes.body.id}/acknowledgements`)
      .set(authHeader(managerToken))
      .expect(200);

    expect(ackListRes.body).toBeDefined();

    const acks = ackListRes.body.items ?? ackListRes.body.data ?? ackListRes.body;
    expect(acks).toBeDefined();
    expect(Array.isArray(acks)).toBe(true);
    expect(acks.length).toBeGreaterThanOrEqual(1);
  });

  it('Duplicate acknowledgement is rejected', async () => {
    const sopRes = await request(app.getHttpServer())
      .post('/api/training/sops')
      .set(authHeader(hrToken))
      .send({ title: 'Security SOP', content: 'Lock screens' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/training/sops/${sopRes.body.id}/acknowledge`)
      .set(authHeader(empToken))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/training/sops/${sopRes.body.id}/acknowledge`)
      .set(authHeader(empToken))
      .send({})
      .expect(409);
  });
});

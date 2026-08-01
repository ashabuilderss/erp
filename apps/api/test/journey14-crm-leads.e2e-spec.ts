import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 14 — CRM Leads', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;
  let ownerToken: string;
  let empToken: string;
  let empEmployeeId: string;
  let fieldToken: string;
  let fieldEmployeeId: string;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(
      ctx.prisma,
      'journey14',
      UserRole.OWNER,
    );

    ownerToken = await login(app, fixture.user.email, fixture.password);

    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey14-emp@example.com',
        firstName: 'CRM',
        lastName: 'Employee',
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

    empEmployeeId = empRes.body.id;
    empToken = await login(app, empUser.email, 'Password@123');

    const fieldUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey14-field@example.com',
        firstName: 'Field',
        lastName: 'Worker',
        role: UserRole.FIELD_EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const fieldRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(ownerToken))
      .send({
        userId: fieldUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        staffType: 'FIELD',
        status: 'ACTIVE',
      })
      .expect(201);

    fieldEmployeeId = fieldRes.body.id;
    fieldToken = await login(app, fieldUser.email, 'Password@123');
  });

  afterAll(async () => {
    await app.close();
  });

  it('employee can create and view leads', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(empToken))
      .send({
        customerName: 'Employee Lead',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '9999999999',
        assignedToEmployeeId: empEmployeeId,
      })
      .expect(201);

    expect(createRes.body.customerName).toBe('Employee Lead');
    const leadId = createRes.body.id as string;

    const listRes = await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(empToken))
      .expect(200);

    expect(listRes.body.data).toBeDefined();
    const lead = listRes.body.data.find((l: any) => l.id === leadId);
    expect(lead).toBeDefined();
  });

  it('field employee can create and view leads', async () => {
    await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(fieldToken))
      .send({
        customerName: 'Field Customer',
        source: 'WALK_IN',
        status: 'NEW',
        customerPhone: '4040404040',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(fieldToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('owner can create leads', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Owner Lead',
        source: 'REFERRAL',
        status: 'NEW',
        customerPhone: '8888888888',
      })
      .expect(201);

    expect(createRes.body.customerName).toBe('Owner Lead');
  });

  it('lead follow-up can be added and listed', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(empToken))
      .send({
        customerName: 'FollowUp Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '5050505050',
        assignedToEmployeeId: empEmployeeId,
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    const followUpRes = await request(app.getHttpServer())
      .post(`/api/leads/${leadId}/follow-ups`)
      .set(authHeader(empToken))
      .send({
        notes: 'Called customer, they are interested in site visit.',
        type: 'CALL',
      })
      .expect(201);

    expect(followUpRes.body).toBeDefined();

    const listRes = await request(app.getHttpServer())
      .get(`/api/leads/${leadId}/follow-ups`)
      .set(authHeader(empToken))
      .expect(200);

    expect(listRes.body).toBeDefined();
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
  });
});

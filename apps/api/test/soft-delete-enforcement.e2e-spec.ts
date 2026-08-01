import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Soft-Delete Enforcement', () => {
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
    fixture = await createCompanyFixture(ctx.prisma, 'softdel', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lead deletion soft-deletes record in database', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Delete Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '1234567890',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const dbLead = await ctx.prisma.lead.findUnique({
      where: { id: leadId },
    });

    expect(dbLead).not.toBeNull();
    expect(dbLead!.deletedAt).not.toBeNull();
  });

  it('property deletion soft-deletes record in database', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(ownerToken))
      .send({
        title: 'Delete Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Test City',
        city: 'Test City',
        state: 'Test State',
      })
      .expect(201);

    const propertyId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/properties/${propertyId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    const dbProperty = await ctx.prisma.property.findUnique({
      where: { id: propertyId },
    });

    expect(dbProperty).not.toBeNull();
    expect(dbProperty!.deletedAt).not.toBeNull();
  });

  it('deleted lead is no longer accessible via GET', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Gone Customer',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '9876543210',
      })
      .expect(201);

    const leadId = createRes.body.id as string;

    await request(app.getHttpServer())
      .delete(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/leads/${leadId}`)
      .set(authHeader(ownerToken))
      .expect(404);
  });

  it('non-owner/admin cannot delete leads', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'softdel-emp@example.com',
        firstName: 'Soft',
        lastName: 'Employee',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });

    const empToken = await login(app, empUser.email, 'Password@123');

    const createRes = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(ownerToken))
      .send({
        customerName: 'Protected Lead',
        source: 'WEBSITE',
        status: 'NEW',
        customerPhone: '5555555555',
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/leads/${createRes.body.id}`)
      .set(authHeader(empToken))
      .expect(403);
  });
});

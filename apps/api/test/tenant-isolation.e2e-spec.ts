import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('Tenant isolation e2e', () => {
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

  it('does not expose one company lead to another company', async () => {
    const alpha = await createCompanyFixture(ctx.prisma, 'alpha');
    const beta = await createCompanyFixture(ctx.prisma, 'beta');

    const alphaLead = await ctx.prisma.lead.create({
      data: {
        companyId: alpha.company.id,
        customerName: 'Alpha Buyer',
        customerEmail: 'alpha-buyer@example.com',
        source: 'WEBSITE',
        status: 'NEW',
      },
    });

    const betaToken = await login(app, beta.user.email, beta.password);

    await request(app.getHttpServer())
      .get(`/api/leads/${alphaLead.id}`)
      .set(authHeader(betaToken))
      .expect(404);
  });

  it('does not expose one company property to another company', async () => {
    const alpha = await createCompanyFixture(ctx.prisma, 'alpha');
    const beta = await createCompanyFixture(ctx.prisma, 'beta');

    const alphaProperty = await ctx.prisma.property.create({
      data: {
        companyId: alpha.company.id,
        title: 'Alpha Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Alpha City',
        city: 'Alpha City',
        state: 'Alpha State',
      },
    });

    const betaToken = await login(app, beta.user.email, beta.password);

    await request(app.getHttpServer())
      .get(`/api/properties/${alphaProperty.id}`)
      .set(authHeader(betaToken))
      .expect(404);
  });

  it('does not expose one company site-visit to another company', async () => {
    const alpha = await createCompanyFixture(ctx.prisma, 'alpha');
    const beta = await createCompanyFixture(ctx.prisma, 'beta');

    const alphaProperty = await ctx.prisma.property.create({
      data: {
        companyId: alpha.company.id,
        title: 'Alpha Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Alpha City',
        city: 'Alpha City',
        state: 'Alpha State',
      },
    });

    const alphaCustomer = await ctx.prisma.customer.create({
      data: {
        companyId: alpha.company.id,
        name: 'Alpha Customer',
      },
    });

    const alphaVisit = await ctx.prisma.siteVisit.create({
      data: {
        companyId: alpha.company.id,
        propertyId: alphaProperty.id,
        customerId: alphaCustomer.id,
        scheduledDate: new Date(),
        assignedToEmployeeId: alpha.employee.id,
      },
    });

    const betaToken = await login(app, beta.user.email, beta.password);

    await request(app.getHttpServer())
      .get(`/api/site-visits/${alphaVisit.id}`)
      .set(authHeader(betaToken))
      .expect(404);
  });

  it('does not expose one company booking to another company', async () => {
    const alpha = await createCompanyFixture(ctx.prisma, 'alpha');
    const beta = await createCompanyFixture(ctx.prisma, 'beta');

    const alphaProperty = await ctx.prisma.property.create({
      data: {
        companyId: alpha.company.id,
        title: 'Alpha Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Alpha City',
        city: 'Alpha City',
        state: 'Alpha State',
      },
    });

    const alphaCustomer = await ctx.prisma.customer.create({
      data: {
        companyId: alpha.company.id,
        name: 'Alpha Customer',
      },
    });

    const alphaBooking = await ctx.prisma.booking.create({
      data: {
        companyId: alpha.company.id,
        propertyId: alphaProperty.id,
        customerId: alphaCustomer.id,
        bookingDate: new Date(),
        amount: 1000000,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        assignedToEmployeeId: alpha.employee.id,
      },
    });

    const betaToken = await login(app, beta.user.email, beta.password);

    await request(app.getHttpServer())
      .get(`/api/bookings/${alphaBooking.id}`)
      .set(authHeader(betaToken))
      .expect(404);
  });

  it('limits employee lead listing to assigned leads only', async () => {
    const fixture = await createCompanyFixture(
      ctx.prisma,
      'employee',
      UserRole.EMPLOYEE,
    );
    const unassigned = await ctx.prisma.lead.create({
      data: {
        companyId: fixture.company.id,
        customerName: 'Unassigned Buyer',
        source: 'REFERRAL',
        status: 'NEW',
      },
    });
    const assigned = await ctx.prisma.lead.create({
      data: {
        companyId: fixture.company.id,
        customerName: 'Assigned Buyer',
        source: 'WEBSITE',
        status: 'NEW',
        assignedToEmployeeId: fixture.employee.id,
      },
    });

    const token = await login(app, fixture.user.email, fixture.password);
    const response = await request(app.getHttpServer())
      .get('/api/leads')
      .set(authHeader(token))
      .expect(200);

    const ids = response.body.data.map((lead: { id: string }) => lead.id);
    expect(ids).toContain(assigned.id);
    expect(ids).not.toContain(unassigned.id);
  });

  it('limits employee property listing to assigned properties only', async () => {
    const fixture = await createCompanyFixture(
      ctx.prisma,
      'employee',
      UserRole.EMPLOYEE,
    );
    const unassigned = await ctx.prisma.property.create({
      data: {
        companyId: fixture.company.id,
        title: 'Unassigned Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'City A',
        city: 'City A',
        state: 'State A',
      },
    });
    const assigned = await ctx.prisma.property.create({
      data: {
        companyId: fixture.company.id,
        title: 'Assigned Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 2000000,
        location: 'City B',
        city: 'City B',
        state: 'State B',
        assignedToEmployeeId: fixture.employee.id,
      },
    });

    const token = await login(app, fixture.user.email, fixture.password);
    const response = await request(app.getHttpServer())
      .get('/api/properties')
      .set(authHeader(token))
      .expect(200);

    const ids = response.body.data.map((p: { id: string }) => p.id);
    expect(ids).toContain(assigned.id);
    expect(ids).not.toContain(unassigned.id);
  });

  it('limits employee site-visit listing to assigned visits only', async () => {
    const fixture = await createCompanyFixture(
      ctx.prisma,
      'employee',
      UserRole.EMPLOYEE,
    );
    const property = await ctx.prisma.property.create({
      data: {
        companyId: fixture.company.id,
        title: 'Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'City',
        city: 'City',
        state: 'State',
      },
    });
    const customer = await ctx.prisma.customer.create({
      data: { companyId: fixture.company.id, name: 'Test Customer' },
    });
    const unassigned = await ctx.prisma.siteVisit.create({
      data: {
        companyId: fixture.company.id,
        propertyId: property.id,
        customerId: customer.id,
        scheduledDate: new Date(),
        assignedToEmployeeId: fixture.employee.id,
      },
    });

    const token = await login(app, fixture.user.email, fixture.password);
    const response = await request(app.getHttpServer())
      .get('/api/site-visits')
      .set(authHeader(token))
      .expect(200);

    const ids = response.body.data.map((v: { id: string }) => v.id);
    expect(ids).toContain(unassigned.id);
  });

  it('limits employee booking listing to assigned bookings only', async () => {
    const fixture = await createCompanyFixture(
      ctx.prisma,
      'employee',
      UserRole.EMPLOYEE,
    );
    const property = await ctx.prisma.property.create({
      data: {
        companyId: fixture.company.id,
        title: 'Test Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'City',
        city: 'City',
        state: 'State',
      },
    });
    const customer = await ctx.prisma.customer.create({
      data: { companyId: fixture.company.id, name: 'Test Customer' },
    });
    const assigned = await ctx.prisma.booking.create({
      data: {
        companyId: fixture.company.id,
        propertyId: property.id,
        customerId: customer.id,
        bookingDate: new Date(),
        amount: 1000000,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        assignedToEmployeeId: fixture.employee.id,
      },
    });

    const token = await login(app, fixture.user.email, fixture.password);
    const response = await request(app.getHttpServer())
      .get('/api/bookings')
      .set(authHeader(token))
      .expect(200);

    const ids = response.body.data.map((b: { id: string }) => b.id);
    expect(ids).toContain(assigned.id);
  });

  it('does not allow cross-company employee assignment on property creation', async () => {
    const alpha = await createCompanyFixture(ctx.prisma, 'alpha');
    const beta = await createCompanyFixture(ctx.prisma, 'beta');

    const betaToken = await login(app, beta.user.email, beta.password);

    await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(betaToken))
      .send({
        title: 'Beta Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Beta City',
        city: 'Beta City',
        state: 'Beta State',
        assignedToEmployeeId: alpha.employee.id,
      })
      .expect(400);
  });
});

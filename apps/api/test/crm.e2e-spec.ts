import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('CRM workflows e2e', () => {
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

  it('creates a property, lead, customer, site visit, and booking', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'crm');
    const token = await login(app, fixture.user.email, fixture.password);

    const leadProperty = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Production Test Apartment',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Test City Center',
        city: 'Test City',
        state: 'Test State',
        area: 1200,
        bedrooms: 2,
        bathrooms: 2,
      })
      .expect(201);

    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(token))
      .send({
        propertyId: leadProperty.body.id,
        customerName: 'Buyer One',
        customerEmail: 'buyer@example.com',
        customerPhone: '9999999999',
        source: 'WEBSITE',
        assignedToEmployeeId: fixture.employee.id,
      })
      .expect(201);

    const converted = await request(app.getHttpServer())
      .post(`/api/leads/${lead.body.id}/convert`)
      .set(authHeader(token))
      .expect(201);

    expect(converted.body.customer.id).toEqual(expect.any(String));
    expect(converted.body.lead.status).toBe('CONVERTED');

    const siteVisit = await request(app.getHttpServer())
      .post('/api/site-visits')
      .set(authHeader(token))
      .send({
        propertyId: leadProperty.body.id,
        customerId: converted.body.customer.id,
        leadId: lead.body.id,
        scheduledDate: new Date(Date.now() + 86_400_000).toISOString(),
        assignedToEmployeeId: fixture.employee.id,
        notes: 'Production readiness smoke visit',
      })
      .expect(201);

    expect(siteVisit.body.propertyId).toBe(leadProperty.body.id);
    expect(siteVisit.body.customerId).toBe(converted.body.customer.id);

    const bookingProperty = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Production Test Booking Apartment',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1200000,
        location: 'Booking Test City Center',
        city: 'Test City',
        state: 'Test State',
        area: 1300,
        bedrooms: 3,
        bathrooms: 2,
      })
      .expect(201);

    const booking = await request(app.getHttpServer())
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        propertyId: bookingProperty.body.id,
        customerId: converted.body.customer.id,
        leadId: lead.body.id,
        assignedToEmployeeId: fixture.employee.id,
        bookingDate: new Date().toISOString(),
        amount: 1200000,
        status: 'PENDING',
        paymentStatus: 'PARTIAL',
      })
      .expect(201);

    expect(booking.body.customerId).toBe(converted.body.customer.id);
    expect(booking.body.propertyId).toBe(bookingProperty.body.id);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});

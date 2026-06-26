import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';

describe('Leads flow e2e', () => {
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

  it('updates lead status through the pipeline', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'leads-flow');
    const token = await login(app, fixture.user.email, fixture.password);

    const property = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Lead Pipeline Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Pipeline City',
        city: 'Pipeline City',
        state: 'Pipeline State',
        area: 1200,
        bedrooms: 2,
        bathrooms: 2,
      })
      .expect(201);

    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(token))
      .send({
        propertyId: property.body.id,
        customerName: 'Pipeline Lead',
        customerEmail: 'pipeline@example.com',
        customerPhone: '8888888888',
        source: 'WEBSITE',
        assignedToEmployeeId: fixture.employee.id,
      })
      .expect(201);

    expect(lead.body.status).toBe('NEW');

    const contacted = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.body.id}/status`)
      .set(authHeader(token))
      .send({ status: 'CONTACTED' })
      .expect(200);

    expect(contacted.body.status).toBe('CONTACTED');

    const interested = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.body.id}/status`)
      .set(authHeader(token))
      .send({ status: 'INTERESTED' })
      .expect(200);

    expect(interested.body.status).toBe('INTERESTED');

    const siteVisit = await request(app.getHttpServer())
      .patch(`/api/leads/${lead.body.id}/status`)
      .set(authHeader(token))
      .send({ status: 'SITE_VISIT_SCHEDULED' })
      .expect(200);

    expect(siteVisit.body.status).toBe('SITE_VISIT_SCHEDULED');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('converts lead to customer and creates customer record', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'leads-flow');
    const token = await login(app, fixture.user.email, fixture.password);

    const property = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Convert Lead Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1500000,
        location: 'Convert City',
        city: 'Convert City',
        state: 'Convert State',
        area: 1400,
        bedrooms: 3,
        bathrooms: 2,
      })
      .expect(201);

    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(token))
      .send({
        propertyId: property.body.id,
        customerName: 'Convert Lead',
        customerEmail: 'convert@example.com',
        customerPhone: '7777777777',
        source: 'REFERRAL',
        assignedToEmployeeId: fixture.employee.id,
      })
      .expect(201);

    const converted = await request(app.getHttpServer())
      .post(`/api/leads/${lead.body.id}/convert`)
      .set(authHeader(token))
      .expect(201);

    expect(converted.body.lead.status).toBe('CONVERTED');
    expect(converted.body.customer.id).toEqual(expect.any(String));

    const updatedProperty = await request(app.getHttpServer())
      .get(`/api/properties/${property.body.id}`)
      .set(authHeader(token))
      .expect(200);

    expect(updatedProperty.body.status).toBe('BOOKED');
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('rejects status update on already converted lead', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(ctx.prisma, 'leads-flow');
    const token = await login(app, fixture.user.email, fixture.password);

    const property = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Reject Update Property',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 900000,
        location: 'Reject City',
        city: 'Reject City',
        state: 'Reject State',
        area: 1000,
        bedrooms: 2,
        bathrooms: 1,
      })
      .expect(201);

    const lead = await request(app.getHttpServer())
      .post('/api/leads')
      .set(authHeader(token))
      .send({
        propertyId: property.body.id,
        customerName: 'Reject Update Lead',
        customerEmail: 'reject-update@example.com',
        customerPhone: '6666666666',
        source: 'WALK_IN',
        assignedToEmployeeId: fixture.employee.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/leads/${lead.body.id}/convert`)
      .set(authHeader(token))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/leads/${lead.body.id}/status`)
      .set(authHeader(token))
      .send({ status: 'CONTACTED' })
      .expect(400);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });
});

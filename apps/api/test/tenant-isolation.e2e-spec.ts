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
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
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
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });

  it('limits employee lead listing to assigned leads only', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const fixture = await createCompanyFixture(
      ctx.prisma,
      'employee',
      UserRole.EMPLOYEE,
    );
    const unassignedLead = await ctx.prisma.lead.create({
      data: {
        companyId: fixture.company.id,
        customerName: 'Unassigned Buyer',
        source: 'REFERRAL',
        status: 'NEW',
      },
    });
    const assignedLead = await ctx.prisma.lead.create({
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
    expect(ids).toContain(assignedLead.id);
    expect(ids).not.toContain(unassignedLead.id);
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  });
});

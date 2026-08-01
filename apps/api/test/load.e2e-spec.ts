import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Non-Functional Testing — Load', () => {
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
    fixture = await createCompanyFixture(ctx.prisma, 'load', UserRole.OWNER);
    ownerToken = await login(app, fixture.user.email, fixture.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('concurrent task creation handles 20 parallel requests without errors', async () => {
    const empCount = 20;
    const employeeIds: string[] = [];

    for (let i = 0; i < empCount; i++) {
      const empUser = await ctx.prisma.user.create({
        data: {
          companyId: fixture.company.id,
          email: `load-emp-${i}@example.com`,
          firstName: 'Load',
          lastName: `Employee ${i}`,
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

      employeeIds.push(empRes.body.id as string);
    }

    const taskPromises = employeeIds.map((empId, i) =>
      request(app.getHttpServer())
        .post('/api/tasks')
        .set(authHeader(ownerToken))
        .send({
          assigneeId: empId,
          category: 'SITE_WORK',
          title: `Load test task ${i}`,
          description: 'Overdue task for load testing',
          priority:
            i % 3 === 0 ? 'CRITICAL' : i % 3 === 1 ? 'IMPORTANT' : 'NORMAL',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }),
    );

    const taskResults = await Promise.all(taskPromises);
    const taskSuccessCount = taskResults.filter((r) => r.status === 201).length;
    expect(taskSuccessCount).toBe(empCount);
  });

  it('concurrent read operations handle parallel requests within timeout', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Load Lead ${i}`,
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: `555000${i.toString().padStart(4, '0')}`,
        })
        .expect(201);
    }

    const start = Date.now();

    const readPromises = Array.from({ length: 10 }, () =>
      request(app.getHttpServer())
        .get('/api/leads')
        .set(authHeader(ownerToken))
        .expect(200),
    );

    const results = await Promise.all(readPromises);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(30000);
    for (const res of results) {
      expect(res.body).toBeDefined();
    }
  });

  it('mixed concurrent CRUD operations complete without errors', async () => {
    const createPromises = Array.from({ length: 5 }, (_, i) =>
      request(app.getHttpServer())
        .post('/api/leads')
        .set(authHeader(ownerToken))
        .send({
          customerName: `Mixed Lead ${i}`,
          source: 'WEBSITE',
          status: 'NEW',
          customerPhone: `666000${i.toString().padStart(4, '0')}`,
        }),
    );

    const created = await Promise.all(createPromises);
    const successIds = created
      .filter((r) => r.status === 201)
      .map((r) => r.body.id as string);

    expect(successIds.length).toBe(5);

    const mixedPromises = [
      ...successIds.map((id) =>
        request(app.getHttpServer())
          .get(`/api/leads/${id}`)
          .set(authHeader(ownerToken)),
      ),
      request(app.getHttpServer())
        .get('/api/leads')
        .set(authHeader(ownerToken)),
      request(app.getHttpServer())
        .get('/api/employees')
        .set(authHeader(ownerToken)),
    ];

    const mixedResults = await Promise.all(mixedPromises);
    for (const res of mixedResults) {
      expect([200, 201]).toContain(res.status);
    }
  });
});

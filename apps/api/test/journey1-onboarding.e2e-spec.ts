import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { authHeader, login } from './helpers/auth';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { UserRole } from '@prisma/client';

describe('Journey 1 — Employee Onboarding → Active', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createCompanyFixture>>;

  beforeAll(async () => {
    ctx = await createE2eApp();
    app = ctx.app;
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    fixture = await createCompanyFixture(ctx.prisma, 'journey1', UserRole.ADMIN);
  });

  afterAll(async () => {
    await app.close();
  });

  it('complete onboarding: Admin creates → HR profiles → Owner activates', async () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    const adminToken = await login(app, fixture.user.email, fixture.password);

    const ownerUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey1-owner@example.com',
        firstName: 'Test',
        lastName: 'Owner',
        role: UserRole.OWNER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    const ownerToken = await login(app, ownerUser.email, 'Password@123');

    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey1-hr@example.com',
        firstName: 'Test',
        lastName: 'HR',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    const hrToken = await login(app, hrUser.email, 'Password@123');

    const newUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'new-employee@example.com',
        firstName: 'Raj',
        lastName: 'Kumar',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: false,
      },
    });

    // Step 1: Admin creates employee record (INACTIVE — not yet onboarded)
    const createRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(adminToken))
      .send({
        userId: newUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        status: 'INACTIVE',
        staffType: 'OFFICE',
      })
      .expect(201);

    const employeeId = createRes.body.id;
    expect(employeeId).toBeDefined();
    expect(createRes.body.status).toBe('INACTIVE');
    expect(createRes.body.employeeCode).toBeDefined();
    expect(createRes.body.users.email).toBe('new-employee@example.com');

    // Step 2: HR completes profile (add phone, dateOfJoining, salary, address)
    const profileRes = await request(app.getHttpServer())
      .patch(`/api/employees/${employeeId}`)
      .set(authHeader(hrToken))
      .send({
        phone: '+91-9876543210',
        dateOfJoining: '2026-08-01',
        salary: 50000,
        address: '123 MG Road, Bangalore',
      })
      .expect(200);

    expect(profileRes.body.phone).toBe('+91-9876543210');
    expect(profileRes.body.salary).toBe('50000');
    expect(profileRes.body.address).toBe('123 MG Road, Bangalore');

    // Step 3: Owner activates the employee
    const activateRes = await request(app.getHttpServer())
      .patch(`/api/employees/${employeeId}`)
      .set(authHeader(ownerToken))
      .send({
        status: 'ACTIVE',
      })
      .expect(200);

    expect(activateRes.body.status).toBe('ACTIVE');

    // Step 4: Owner also activates the user account
    await request(app.getHttpServer())
      .patch(`/api/users/${newUser.id}`)
      .set(authHeader(ownerToken))
      .send({
        isActive: true,
      })
      .expect(200);

    // Verify: Employee can now login and access their profile
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'new-employee@example.com', password: 'Password@123' })
      .expect(201);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user.role).toBe(UserRole.EMPLOYEE);

    // Verify: Employee can access their own profile
    const profileCheck = await request(app.getHttpServer())
      .get('/api/employees/me')
      .set(authHeader(loginRes.body.accessToken))
      .expect(200);

    expect(profileCheck.body.status).toBe('ACTIVE');
    expect(profileCheck.body.employeeCode).toBeDefined();
    expect(profileCheck.body.departments.name).toBe('Operations');

    // Verify: HR can see the employee in the employee list
    const listRes = await request(app.getHttpServer())
      .get('/api/employees')
      .set(authHeader(hrToken))
      .expect(200);

    const found = listRes.body.data.find(
      (e: { id: string }) => e.id === employeeId,
    );
    expect(found).toBeDefined();
    expect(found.status).toBe('ACTIVE');

    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  });

  it('rejects employee creation without required fields', async () => {
    const adminToken = await login(app, fixture.user.email, fixture.password);

    await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(adminToken))
      .send({
        departmentId: fixture.department.id,
      })
      .expect(400);
  });

  it('rejects employee creation by EMPLOYEE role', async () => {
    const empUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey1-emp@example.com',
        firstName: 'Test',
        lastName: 'Emp',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    const empToken = await login(app, empUser.email, 'Password@123');

    await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(empToken))
      .send({
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
      })
      .expect(403);
  });

  it('Employee profile completion restricts salary viewing to privileged roles', async () => {
    const adminToken = await login(app, fixture.user.email, fixture.password);

    const newUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey1-restrict@example.com',
        firstName: 'Secret',
        lastName: 'User',
        role: UserRole.EMPLOYEE,
        hashedPassword: await bcrypt.hash('Password@123', 12),
        isActive: true,
      },
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/employees')
      .set(authHeader(adminToken))
      .send({
        userId: newUser.id,
        departmentId: fixture.department.id,
        designationId: fixture.designation.id,
        salary: 75000,
        phone: '+91-1111111111',
        address: 'Secret Address',
        status: 'ACTIVE',
      })
      .expect(201);

    const empToken = await login(app, newUser.email, 'Password@123');

    const meRes = await request(app.getHttpServer())
      .get('/api/employees/me')
      .set(authHeader(empToken))
      .expect(200);

    // EMPLOYEE role should NOT see salary, phone, or address
    expect(meRes.body.salary).toBeUndefined();
    expect(meRes.body.phone).toBeUndefined();
    expect(meRes.body.address).toBeUndefined();

    // HR Manager SHOULD see salary, phone, address
    const hrUser = await ctx.prisma.user.create({
      data: {
        companyId: fixture.company.id,
        email: 'journey1-hr-check@example.com',
        firstName: 'HR',
        lastName: 'Check',
        role: UserRole.HR_MANAGER,
        hashedPassword: await bcrypt.hash('Password@123', 12),
      },
    });
    const hrToken = await login(app, hrUser.email, 'Password@123');

    const hrListRes = await request(app.getHttpServer())
      .get(`/api/employees/${createRes.body.id}`)
      .set(authHeader(hrToken))
      .expect(200);

    expect(hrListRes.body.salary).toBe('75000');
    expect(hrListRes.body.phone).toBe('+91-1111111111');
    expect(hrListRes.body.address).toBe('Secret Address');
  });
});

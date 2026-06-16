# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current review-ready RealEstate CRM into a production release candidate that can be handed to the owner with tests, deployment proof, security hygiene, and a clear runbook.

**Architecture:** Keep the current two-app workspace: Next.js web app in `apps/web`, NestJS API in `apps/api`, and PostgreSQL through Prisma. Keep NextAuth as the browser session layer and the web API proxy as the bridge that signs short-lived backend JWTs. Add confidence around the existing architecture through e2e coverage, Docker deployment verification, stricter linting, and explicit owner handoff documentation.

**Tech Stack:** Next.js 16, React 19, NextAuth v5 beta, NestJS 11, Prisma 7, PostgreSQL 16, Jest, Supertest, Playwright, Docker Compose.

---

## Current Baseline

- `npm.cmd run build --workspace=apps/web` passes.
- `npm.cmd run build --workspace=apps/api` passes.
- `npm.cmd run lint --workspace=apps/web -- --quiet` passes.
- `npm.cmd run lint --workspace=apps/web` exits 0 but still reports warnings.
- `npm.cmd test --workspace=apps/api -- --runInBand` reports no tests found.
- Backend health endpoint responds on `http://localhost:4000/api/health`.
- Browser login with seeded admin reaches `http://localhost:3000/dashboard`.
- `docker-compose.yml` references Dockerfiles that now exist, but full compose build/run has not been verified.

## File Structure

Create or modify these files during execution:

- Create: `docs/production/runbook.md` - owner/deployer operating guide.
- Create: `docs/production/release-checklist.md` - final release gate checklist.
- Create: `.env.production.example` - root production environment template for Compose.
- Modify: `TRACKER.md` - add production-readiness plan and execution evidence.
- Modify: `package.json` - add root verification scripts.
- Modify: `apps/api/package.json` - add production migration script and test scripts if missing.
- Modify: `apps/api/prisma/seed.ts` - make production seeding require explicit credentials.
- Create: `apps/api/test/helpers/e2e-app.ts` - Nest e2e app setup.
- Create: `apps/api/test/helpers/database.ts` - database reset and test data helpers.
- Create: `apps/api/test/helpers/auth.ts` - login and authorization helpers.
- Create: `apps/api/test/auth.e2e-spec.ts` - auth login, refresh, logout, and me endpoint tests.
- Create: `apps/api/test/tenant-isolation.e2e-spec.ts` - cross-company data isolation tests.
- Create: `apps/api/test/crm.e2e-spec.ts` - leads, customers, properties, site visits, and bookings smoke tests.
- Create: `apps/api/test/hrms.e2e-spec.ts` - departments, employees, attendance, leave allocation, and leave request smoke tests.
- Modify: `apps/web/package.json` - add Playwright scripts and dependency.
- Create: `apps/web/playwright.config.ts` - local e2e browser test config.
- Create: `apps/web/e2e/auth-dashboard.spec.ts` - login/dashboard browser smoke.
- Create: `apps/web/e2e/navigation.spec.ts` - core page navigation smoke.
- Modify: `apps/web/src/middleware.ts` and create `apps/web/src/proxy.ts` - migrate Next.js deprecated middleware convention.
- Modify: `apps/web/src/app/api/proxy/[...path]/route.ts` - replace unsafe `any` in proxy token handling.
- Modify: `apps/web/src/lib/api.ts` - replace broad API `any` types.
- Modify: `apps/web/eslint.config.mjs` - restore production lint strictness after warning cleanup.
- Modify: `docker-compose.yml` - add migration behavior and production-safe container startup.
- Create: `apps/api/.dockerignore` - keep API Docker context lean.
- Create: `apps/web/.dockerignore` - keep web Docker context lean.

---

## Task 1: Production Docs and Environment Contract

**Files:**
- Create: `.env.production.example`
- Create: `docs/production/runbook.md`
- Create: `docs/production/release-checklist.md`
- Modify: `TRACKER.md`

- [ ] **Step 1: Create the production environment template**

Add `.env.production.example` with this content:

```dotenv
# Copy to .env.production or provide these values through the deployment platform.
NODE_ENV=production

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-strong-database-password
POSTGRES_DB=realestate_crm
DATABASE_URL=postgresql://postgres:replace-with-strong-database-password@postgres:5432/realestate_crm

# Auth
AUTH_SECRET=replace-with-32-byte-minimum-random-secret
AUTH_URL=https://replace-with-owner-domain.example
AUTH_TRUST_HOST=true
FRONTEND_URL=https://replace-with-owner-domain.example

# Optional but required if encryption-backed features are enabled.
ENCRYPTION_KEY=replace-with-32-byte-minimum-random-key

# Production seed is explicit only.
SEED_COMPANY_NAME=Owner Company
SEED_COMPANY_SLUG=owner-company
SEED_ADMIN_EMAIL=owner-admin@example.com
SEED_ADMIN_PASSWORD=replace-with-temporary-password-and-rotate-after-login
```

- [ ] **Step 2: Create the production runbook**

Add `docs/production/runbook.md` with sections for:

```markdown
# Production Runbook

## Required Secrets

- `AUTH_SECRET`: random 32-byte minimum secret shared by web and API.
- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `FRONTEND_URL`: public web origin allowed by API CORS.
- `AUTH_URL`: public web origin used by NextAuth.
- `AUTH_TRUST_HOST`: set to `true` behind a trusted reverse proxy.
- `ENCRYPTION_KEY`: random 32-byte minimum key if encryption-backed features are enabled.

## First Deployment

1. Create production database.
2. Configure the environment variables from `.env.production.example`.
3. Run database migrations with `npm.cmd run prisma:migrate:deploy --workspace=apps/api`.
4. Run seed only for the initial owner/admin account with `npm.cmd run prisma:seed --workspace=apps/api`.
5. Build API with `npm.cmd run build --workspace=apps/api`.
6. Build web with `npm.cmd run build --workspace=apps/web`.
7. Start API with `npm.cmd run start:prod --workspace=apps/api`.
8. Start web with `npm.cmd run start --workspace=apps/web`.

## Docker Deployment

1. Copy `.env.production.example` to `.env` and replace every placeholder.
2. Run `docker compose build`.
3. Run `docker compose up -d`.
4. Confirm API health at `http://localhost:4000/api/health`.
5. Confirm web login at `http://localhost:3000/sign-in`.

## Post-Handoff Actions

1. Owner logs in with the temporary admin password.
2. Owner changes the admin password immediately.
3. Deployer stores secrets in the production secret manager.
4. Deployer enables database backups.
5. Deployer records restore-test evidence.
```

- [ ] **Step 3: Create the release checklist**

Add `docs/production/release-checklist.md` with this content:

```markdown
# Release Checklist

- [ ] `npm.cmd run verify` passes from the repository root.
- [ ] `npm.cmd run test:e2e --workspace=apps/api` passes against a clean test database.
- [ ] `npm.cmd run test:e2e --workspace=apps/web` passes against the running production build.
- [ ] `docker compose build` passes.
- [ ] `docker compose up -d` starts `postgres`, `api`, and `web`.
- [ ] API health returns HTTP 200 from `/api/health`.
- [ ] Admin can log in and view dashboard charts.
- [ ] Admin can create a property, lead, customer, employee, attendance entry, and leave allocation.
- [ ] Employee role can only see assigned/allowed data.
- [ ] Cross-company records are not visible across tenant boundaries.
- [ ] Production secrets are not copied from local development.
- [ ] Database backup and restore instructions are verified.
- [ ] `TRACKER.md` contains final evidence and owner handoff verdict.
```

- [ ] **Step 4: Update the tracker**

Append this entry to `TRACKER.md` under Remaining Debt or a new Production Plan section:

```markdown
## Production Plan

- Plan saved at `docs/superpowers/plans/2026-06-14-production-readiness.md`.
- Production completion requires passing API e2e tests, web browser e2e tests, strict lint, Docker Compose verification, secret rotation, and owner runbook verification.
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add .env.production.example docs/production/runbook.md docs/production/release-checklist.md TRACKER.md
git commit -m "docs: add production handoff plan"
```

Expected: commit succeeds and `git status --short` no longer lists these files.

---

## Task 2: Root Verification Scripts

**Files:**
- Modify: `package.json`
- Modify: `apps/api/package.json`

- [ ] **Step 1: Add root verification scripts**

In root `package.json`, update `scripts` to include:

```json
{
  "verify": "npm run lint:all && npm run build && npm run test:all",
  "lint:all": "npm run lint --workspace=apps/web && npm run lint --workspace=apps/api",
  "test:all": "npm run test --workspace=apps/api -- --runInBand && npm run test:e2e --workspace=apps/api",
  "docker:build": "docker compose build",
  "docker:up": "docker compose up -d",
  "docker:down": "docker compose down"
}
```

Keep the existing `dev`, `dev:web`, `dev:api`, `build`, `db:migrate`, `db:seed`, and `db:studio` scripts.

- [ ] **Step 2: Add API production migration script**

In `apps/api/package.json`, add:

```json
{
  "prisma:migrate:deploy": "prisma migrate deploy"
}
```

Keep existing Prisma scripts.

- [ ] **Step 3: Verify script names**

Run:

```powershell
npm.cmd run
npm.cmd run --workspace=apps/api
```

Expected: script list includes root `verify`, root `lint:all`, root `test:all`, and API `prisma:migrate:deploy`.

- [ ] **Step 4: Commit**

Run:

```powershell
git add package.json apps/api/package.json package-lock.json
git commit -m "chore: add production verification scripts"
```

Expected: commit succeeds.

---

## Task 3: Harden Production Seeding

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Replace hardcoded production seed values**

Update `apps/api/prisma/seed.ts` so production cannot silently seed `admin@company.com / Admin@123`. Use this pattern near the top:

```ts
const isProduction = process.env.NODE_ENV === "production";

const seedCompanyName = process.env.SEED_COMPANY_NAME || "Default Company";
const seedCompanySlug = process.env.SEED_COMPANY_SLUG || "default-company";
const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || "admin@company.com";
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";

if (isProduction) {
  const missing = [
    ["SEED_COMPANY_NAME", process.env.SEED_COMPANY_NAME],
    ["SEED_COMPANY_SLUG", process.env.SEED_COMPANY_SLUG],
    ["SEED_ADMIN_EMAIL", process.env.SEED_ADMIN_EMAIL],
    ["SEED_ADMIN_PASSWORD", process.env.SEED_ADMIN_PASSWORD],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(
      `Production seed requires explicit values: ${missing.map(([key]) => key).join(", ")}`,
    );
  }

  if (seedAdminPassword === "Admin@123") {
    throw new Error("Production seed password must not use the local default password");
  }
}
```

Then replace:

```ts
where: { slug: "default-company" },
create: { name: "Default Company", slug: "default-company" },
const hashedPassword = await bcrypt.hash("Admin@123", 10);
email: "admin@company.com",
```

with:

```ts
where: { slug: seedCompanySlug },
create: { name: seedCompanyName, slug: seedCompanySlug },
const hashedPassword = await bcrypt.hash(seedAdminPassword, 12);
email: seedAdminEmail,
```

- [ ] **Step 2: Verify local seed still works**

Run:

```powershell
npm.cmd run prisma:seed --workspace=apps/api
```

Expected: seed completes locally and prints the seeded admin email.

- [ ] **Step 3: Verify production seed fails without explicit values**

Run:

```powershell
$env:NODE_ENV='production'; npm.cmd run prisma:seed --workspace=apps/api
```

Expected: command fails with `Production seed requires explicit values`.

Clear the temporary environment variable:

```powershell
Remove-Item Env:NODE_ENV
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add apps/api/prisma/seed.ts
git commit -m "chore: require explicit production seed credentials"
```

Expected: commit succeeds.

---

## Task 4: API E2E Test Harness

**Files:**
- Create: `apps/api/test/helpers/e2e-app.ts`
- Create: `apps/api/test/helpers/database.ts`
- Create: `apps/api/test/helpers/auth.ts`

- [ ] **Step 1: Create e2e app helper**

Add `apps/api/test/helpers/e2e-app.ts`:

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { LoggerService } from '../../src/common/logger/logger.service';
import { PrismaService } from '../../src/config/prisma.service';

export interface E2eContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createE2eApp(): Promise<E2eContext> {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-that-is-long-enough-for-jwt-signing';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}
```

- [ ] **Step 2: Create database helper**

Add `apps/api/test/helpers/database.ts`:

```ts
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../src/config/prisma.service';

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "activity_logs",
      "notifications",
      "employee_assignments",
      "performance",
      "leave_allocations",
      "leave_requests",
      "attendance",
      "bookings",
      "site_visits",
      "customers",
      "leads",
      "properties",
      "refresh_tokens",
      "employees",
      "designations",
      "departments",
      "users",
      "companies"
    RESTART IDENTITY CASCADE;
  `);
}

export async function createCompanyFixture(
  prisma: PrismaService,
  slug: string,
  role: UserRole = UserRole.ADMIN,
) {
  const company = await prisma.company.create({
    data: { name: `${slug} Company`, slug },
  });

  const department = await prisma.department.create({
    data: { companyId: company.id, name: 'Operations' },
  });

  const designation = await prisma.designation.create({
    data: {
      companyId: company.id,
      departmentId: department.id,
      name: 'Operations Manager',
    },
  });

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      email: `${slug}-admin@example.com`,
      firstName: slug,
      lastName: 'Admin',
      role,
      hashedPassword: await bcrypt.hash('Password@123', 12),
    },
  });

  const employee = await prisma.employee.create({
    data: {
      companyId: company.id,
      userId: user.id,
      departmentId: department.id,
      designationId: designation.id,
      employeeCode: `${slug.toUpperCase()}-001`,
      status: 'ACTIVE',
    },
  });

  return { company, department, designation, user, employee, password: 'Password@123' };
}
```

- [ ] **Step 3: Create auth helper**

Add `apps/api/test/helpers/auth.ts`:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function login(app: INestApplication, email: string, password: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  expect(response.body.accessToken).toEqual(expect.any(String));
  return response.body.accessToken as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
```

- [ ] **Step 4: Verify e2e harness compiles**

Run:

```powershell
npm.cmd run test:e2e --workspace=apps/api -- --runInBand
```

Expected: Jest starts successfully. It may report no e2e specs until Task 5 adds them.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/api/test/helpers
git commit -m "test(api): add e2e test harness"
```

Expected: commit succeeds.

---

## Task 5: API Auth and Tenant Isolation Tests

**Files:**
- Create: `apps/api/test/auth.e2e-spec.ts`
- Create: `apps/api/test/tenant-isolation.e2e-spec.ts`

- [ ] **Step 1: Add auth e2e tests**

Add `apps/api/test/auth.e2e-spec.ts`:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { authHeader, login } from './helpers/auth';

describe('Auth e2e', () => {
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

  it('logs in with valid credentials and returns user context', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'auth');

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: fixture.user.email,
      role: 'ADMIN',
      companyId: fixture.company.id,
      employeeId: fixture.employee.id,
    });
  });

  it('rejects invalid credentials', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'invalid');

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: 'wrong-password' })
      .expect(401);
  });

  it('returns current user profile for authenticated requests', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'me');
    const token = await login(app, fixture.user.email, fixture.password);

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token))
      .expect(200);

    expect(response.body.user.email).toBe(fixture.user.email);
    expect(response.body.company.id).toBe(fixture.company.id);
    expect(response.body.employee.id).toBe(fixture.employee.id);
  });

  it('rotates refresh tokens and rejects reused refresh tokens', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'refresh');
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.user.email, password: fixture.password })
      .expect(201);

    const firstRefreshToken = loginResponse.body.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(firstRefreshToken);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);
  });
});
```

- [ ] **Step 2: Add tenant isolation test**

Add `apps/api/test/tenant-isolation.e2e-spec.ts`:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { authHeader, login } from './helpers/auth';

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

  it('limits employee lead listing to assigned leads only', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'employee', 'EMPLOYEE');
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
  });
});
```

- [ ] **Step 3: Run the auth and tenant tests**

Run:

```powershell
npm.cmd run test:e2e --workspace=apps/api -- --runInBand auth.e2e-spec.ts tenant-isolation.e2e-spec.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

Run:

```powershell
git add apps/api/test/auth.e2e-spec.ts apps/api/test/tenant-isolation.e2e-spec.ts
git commit -m "test(api): cover auth and tenant isolation"
```

Expected: commit succeeds.

---

## Task 6: API Business Workflow Tests

**Files:**
- Create: `apps/api/test/crm.e2e-spec.ts`
- Create: `apps/api/test/hrms.e2e-spec.ts`

- [ ] **Step 1: Add CRM workflow e2e tests**

Add `apps/api/test/crm.e2e-spec.ts` with tests that create and verify the core customer journey:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { authHeader, login } from './helpers/auth';

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
    const fixture = await createCompanyFixture(ctx.prisma, 'crm');
    const token = await login(app, fixture.user.email, fixture.password);

    const property = await request(app.getHttpServer())
      .post('/api/properties')
      .set(authHeader(token))
      .send({
        title: 'Production Test Apartment',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 1000000,
        location: 'Test City',
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

    const siteVisit = await request(app.getHttpServer())
      .post('/api/site-visits')
      .set(authHeader(token))
      .send({
        propertyId: property.body.id,
        customerId: converted.body.customer.id,
        leadId: lead.body.id,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        assignedToEmployeeId: fixture.employee.id,
        notes: 'Production readiness smoke visit',
      })
      .expect(201);

    expect(siteVisit.body.propertyId).toBe(property.body.id);

    const booking = await request(app.getHttpServer())
      .post('/api/bookings')
      .set(authHeader(token))
      .send({
        propertyId: property.body.id,
        customerId: converted.body.customer.id,
        leadId: lead.body.id,
        assignedToEmployeeId: fixture.employee.id,
        bookingDate: new Date().toISOString(),
        totalAmount: 1000000,
        paidAmount: 100000,
        status: 'PENDING',
        paymentStatus: 'PARTIAL',
      })
      .expect(201);

    expect(booking.body.customerId).toBe(converted.body.customer.id);
  });
});
```

- [ ] **Step 2: Add HRMS workflow e2e tests**

Add `apps/api/test/hrms.e2e-spec.ts` with tests for the minimum HR flow:

```ts
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2eApp, E2eContext } from './helpers/e2e-app';
import { createCompanyFixture, resetDatabase } from './helpers/database';
import { authHeader, login } from './helpers/auth';

describe('HRMS workflows e2e', () => {
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

  it('creates employee attendance, leave allocation, and leave request', async () => {
    const fixture = await createCompanyFixture(ctx.prisma, 'hrms');
    const token = await login(app, fixture.user.email, fixture.password);

    const attendance = await request(app.getHttpServer())
      .post('/api/attendance')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        date: '2026-06-14',
        checkIn: '2026-06-14T09:30:00.000Z',
        checkOut: '2026-06-14T18:30:00.000Z',
        status: 'PRESENT',
      })
      .expect(201);

    expect(attendance.body.employeeId).toBe(fixture.employee.id);

    const allocation = await request(app.getHttpServer())
      .post('/api/leave-allocations')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        year: 2026,
        sick: 6,
        casual: 6,
        annual: 12,
      })
      .expect(201);

    expect(allocation.body.employeeId).toBe(fixture.employee.id);

    const leaveRequest = await request(app.getHttpServer())
      .post('/api/leave-requests')
      .set(authHeader(token))
      .send({
        employeeId: fixture.employee.id,
        startDate: '2026-06-20',
        endDate: '2026-06-21',
        type: 'CASUAL',
        reason: 'Production readiness smoke leave',
      })
      .expect(201);

    expect(leaveRequest.body.status).toBe('PENDING');
  });
});
```

- [ ] **Step 3: Run all API e2e tests**

Run:

```powershell
npm.cmd run test:e2e --workspace=apps/api -- --runInBand
```

Expected: auth, tenant isolation, CRM, and HRMS e2e tests all pass.

- [ ] **Step 4: Commit**

Run:

```powershell
git add apps/api/test/crm.e2e-spec.ts apps/api/test/hrms.e2e-spec.ts
git commit -m "test(api): cover core business workflows"
```

Expected: commit succeeds.

---

## Task 7: Web Browser E2E Tests

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/auth-dashboard.spec.ts`
- Create: `apps/web/e2e/navigation.spec.ts`

- [ ] **Step 1: Install Playwright test runner**

Run:

```powershell
npm.cmd install --workspace=apps/web -D @playwright/test
```

Expected: `apps/web/package.json` and `package-lock.json` update.

- [ ] **Step 2: Add web test scripts**

In `apps/web/package.json`, add:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 3: Add Playwright config**

Create `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 4: Add login/dashboard smoke test**

Create `apps/web/e2e/auth-dashboard.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('admin can sign in and see dashboard', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL || 'admin@company.com');
  await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD || 'Admin@123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  await expect(page.getByText(/properties/i).first()).toBeVisible();
});
```

- [ ] **Step 5: Add core navigation smoke test**

Create `apps/web/e2e/navigation.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const pages = [
  '/dashboard',
  '/dashboard/properties',
  '/dashboard/leads',
  '/dashboard/customers',
  '/dashboard/site-visits',
  '/dashboard/bookings',
  '/dashboard/employees',
  '/dashboard/attendance',
  '/dashboard/leave-requests',
  '/dashboard/settings',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL || 'admin@company.com');
  await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD || 'Admin@123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

for (const path of pages) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).not.toHaveURL(/\/sign-in/);
    await expect(page.locator('body')).toContainText(/dashboard|properties|leads|customers|attendance|settings/i);
  });
}
```

- [ ] **Step 6: Run web e2e tests against the running app**

Start the API and web production build, then run:

```powershell
npm.cmd run test:e2e --workspace=apps/web
```

Expected: both Playwright specs pass in Chromium.

- [ ] **Step 7: Commit**

Run:

```powershell
git add apps/web/package.json package-lock.json apps/web/playwright.config.ts apps/web/e2e
git commit -m "test(web): add browser production smokes"
```

Expected: commit succeeds.

---

## Task 8: Next.js Proxy Convention and API Type Cleanup

**Files:**
- Create: `apps/web/src/proxy.ts`
- Delete after verification: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/app/api/proxy/[...path]/route.ts`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Move middleware behavior to proxy file**

Create `apps/web/src/proxy.ts` with the current middleware behavior:

```ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/api/auth');

  if (!isPublic && !req.auth) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

- [ ] **Step 2: Build with both files present**

Run:

```powershell
npm.cmd run build --workspace=apps/web
```

Expected: build passes. If Next.js reports duplicate middleware/proxy handling, delete `apps/web/src/middleware.ts` in the next step and rebuild.

- [ ] **Step 3: Delete deprecated middleware file**

Remove `apps/web/src/middleware.ts` after confirming `apps/web/src/proxy.ts` protects dashboard routes.

Run:

```powershell
npm.cmd run build --workspace=apps/web
```

Expected: build passes without the deprecated `middleware` convention warning.

- [ ] **Step 4: Replace unsafe proxy token type**

In `apps/web/src/app/api/proxy/[...path]/route.ts`, replace:

```ts
async function createApiToken(token: any): Promise<string> {
```

with:

```ts
type SessionTokenForApi = {
  id?: string;
  sub?: string;
  email?: string | null;
  role?: string;
  companyId?: string;
  employeeId?: string | null;
};

async function createApiToken(token: SessionTokenForApi): Promise<string> {
```

- [ ] **Step 5: Replace broad API client object types**

In `apps/web/src/lib/api.ts`, replace:

```ts
function filterUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const filtered: Record<string, any> = {};
```

with:

```ts
type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

function filterUndefined(obj: QueryParams): Record<string, string> {
  const filtered: Record<string, string> = {};
```

And inside the loop use:

```ts
filtered[key] = String(value);
```

Update `api.get` to:

```ts
get: <T>(endpoint: string, params?: QueryParams) => {
  const filteredParams = params ? filterUndefined(params) : undefined;
  const url = filteredParams
    ? `${endpoint}?${new URLSearchParams(filteredParams).toString()}`
    : endpoint;
  return fetchApi<T>(url, { method: "GET" });
},
```

- [ ] **Step 6: Verify lint and build**

Run:

```powershell
npm.cmd run lint --workspace=apps/web
npm.cmd run build --workspace=apps/web
```

Expected: lint exits 0 and build exits 0.

- [ ] **Step 7: Commit**

Run:

```powershell
git add apps/web/src/proxy.ts apps/web/src/app/api/proxy/[...path]/route.ts apps/web/src/lib/api.ts
git rm apps/web/src/middleware.ts
git commit -m "chore(web): migrate middleware to proxy convention"
```

Expected: commit succeeds.

---

## Task 9: Strict Lint Cleanup

**Files:**
- Modify: `apps/web/eslint.config.mjs`
- Modify: files reported by `npm.cmd run lint --workspace=apps/web`
- Modify: files reported by `npm.cmd run lint --workspace=apps/api`

- [ ] **Step 1: Capture frontend warnings**

Run:

```powershell
npm.cmd run lint --workspace=apps/web
```

Expected: command exits 0 and prints the remaining warnings.

- [ ] **Step 2: Fix warnings by category**

Apply these rules to every reported warning:

```text
no-explicit-any: replace with existing app types from apps/web/src/lib/types, local response interfaces, or unknown with runtime narrowing.
no-empty-object-type: replace empty object types with Record<string, never> or remove the redundant type.
no-unused-vars/no-unused-imports: remove the unused binding or prefix intentionally unused function parameters with _.
react-hooks/exhaustive-deps: add missing dependencies, memoize callbacks, or move derived values out of effects.
react-compiler/incompatible-library: isolate the library usage behind memoized inputs and stable table definitions.
```

- [ ] **Step 3: Restore strict frontend lint rules**

In `apps/web/eslint.config.mjs`, change:

```ts
"@typescript-eslint/no-explicit-any": "warn",
"@typescript-eslint/no-empty-object-type": "warn",
```

to:

```ts
"@typescript-eslint/no-explicit-any": "error",
"@typescript-eslint/no-empty-object-type": "error",
```

- [ ] **Step 4: Verify strict frontend lint**

Run:

```powershell
npm.cmd run lint --workspace=apps/web
```

Expected: exits 0 with no warnings that require suppression.

- [ ] **Step 5: Verify API lint**

Run:

```powershell
npm.cmd run lint --workspace=apps/api
```

Expected: exits 0. If auto-fix edits files, inspect the diff before committing.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/web apps/api
git commit -m "chore: clear production lint warnings"
```

Expected: commit succeeds.

---

## Task 10: Docker Production Verification

**Files:**
- Modify: `docker-compose.yml`
- Modify: `apps/api/package.json`
- Create: `apps/api/.dockerignore`
- Create: `apps/web/.dockerignore`

- [ ] **Step 1: Ensure Prisma CLI is available for production migrations**

Move `prisma` from `apps/api/package.json` `devDependencies` into `dependencies`, or keep a separate migration image stage that includes dev dependencies. Prefer moving `prisma` to dependencies so this command works inside the production image:

```json
{
  "dependencies": {
    "prisma": "^7.8.0"
  }
}
```

- [ ] **Step 2: Add Docker ignores**

Create `apps/api/.dockerignore`:

```gitignore
node_modules
dist
coverage
*.log
.env*
tsconfig.build.tsbuildinfo
```

Create `apps/web/.dockerignore`:

```gitignore
node_modules
.next
coverage
playwright-report
test-results
*.log
.env*
```

- [ ] **Step 3: Add migration service to Compose**

In `docker-compose.yml`, add an `api-migrate` service between `postgres` and `api`:

```yaml
  api-migrate:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: dashboard-api-migrate
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/realestate_crm
      AUTH_SECRET: ${AUTH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      FRONTEND_URL: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    command: ["npm", "run", "prisma:migrate:deploy"]
```

Then update `api.depends_on`:

```yaml
    depends_on:
      postgres:
        condition: service_healthy
      api-migrate:
        condition: service_completed_successfully
```

- [ ] **Step 4: Build Docker images**

Run:

```powershell
docker compose build
```

Expected: `dashboard-api` and `dashboard-web` images build successfully without downloading packages at container runtime.

- [ ] **Step 5: Start Docker stack**

Run:

```powershell
docker compose up -d
```

Expected: `postgres`, `api-migrate`, `api`, and `web` complete/start successfully.

- [ ] **Step 6: Verify Docker stack**

Run:

```powershell
docker compose ps
Invoke-WebRequest http://localhost:4000/api/health
Invoke-WebRequest http://localhost:3000
```

Expected:

```text
dashboard-db is running and healthy
dashboard-api-migrate exited with code 0
dashboard-api is running
dashboard-web is running
API health returns HTTP 200
Web returns HTTP 200 or redirects to sign-in
```

- [ ] **Step 7: Commit**

Run:

```powershell
git add docker-compose.yml apps/api/package.json package-lock.json apps/api/.dockerignore apps/web/.dockerignore
git commit -m "chore: verify docker production deployment"
```

Expected: commit succeeds.

---

## Task 11: Final Verification Gate

**Files:**
- Modify: `TRACKER.md`
- Modify: `docs/production/release-checklist.md`

- [ ] **Step 1: Run clean install verification**

Run:

```powershell
npm.cmd ci
```

Expected: dependencies install from `package-lock.json` without lockfile changes.

- [ ] **Step 2: Run full local verification**

Run:

```powershell
npm.cmd run verify
```

Expected: frontend lint, API lint, frontend build, API build, API unit tests, and API e2e tests pass.

- [ ] **Step 3: Run browser e2e verification**

Start API and web production builds, then run:

```powershell
npm.cmd run test:e2e --workspace=apps/web
```

Expected: Playwright browser tests pass.

- [ ] **Step 4: Run Docker verification**

Run:

```powershell
docker compose down
docker compose build
docker compose up -d
docker compose ps
Invoke-WebRequest http://localhost:4000/api/health
```

Expected: Docker stack starts and API health returns HTTP 200.

- [ ] **Step 5: Manual owner acceptance smoke**

Using the browser, verify:

```text
Admin login works.
Dashboard loads charts without console errors.
Properties page loads.
Leads page loads.
Customers page loads.
Bookings page loads.
Employees page loads.
Attendance page loads.
Leave requests page loads.
Settings page loads.
Employee role cannot delete admin-only records.
Company B cannot see Company A lead by direct URL.
```

- [ ] **Step 6: Update tracker with final evidence**

Update `TRACKER.md` with exact command evidence:

```markdown
## Final Production Verification

Date: 2026-06-14

| Gate | Result | Evidence |
| --- | --- | --- |
| Root verify | Passed | `npm.cmd run verify` exits 0 |
| API e2e | Passed | `npm.cmd run test:e2e --workspace=apps/api -- --runInBand` exits 0 |
| Web e2e | Passed | `npm.cmd run test:e2e --workspace=apps/web` exits 0 |
| Docker build | Passed | `docker compose build` exits 0 |
| Docker run | Passed | `docker compose up -d` starts all services |
| API health | Passed | `/api/health` returns HTTP 200 |
| Browser smoke | Passed | Admin dashboard and core pages verified |

## Owner Handoff Verdict

Ready for owner production handoff after secrets are rotated and the deployment environment uses the production values from `.env.production.example`.
```

- [ ] **Step 7: Commit final evidence**

Run:

```powershell
git add TRACKER.md docs/production/release-checklist.md
git commit -m "docs: record production verification evidence"
```

Expected: commit succeeds.

---

## Self-Review

**Spec coverage:** This plan covers the production gaps recorded in `TRACKER.md`: missing API tests, frontend warnings, unverified Docker deployment, deprecated Next middleware convention, secret handling, and owner handoff docs.

**Placeholder scan:** The plan has no deferred-work markers. Each task has exact files, commands, expected results, and concrete acceptance criteria.

**Type consistency:** Test helpers use `E2eContext`, `PrismaService`, `UserRole`, Supertest, and the existing `/api/*` routes consistently. Web auth tests use the existing seeded credentials only for local e2e and the production docs require explicit owner credentials.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-14-production-readiness.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, and move faster with lower context risk.

**2. Inline Execution** - execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

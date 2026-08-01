# Asha Builders ERP

Full-stack enterprise resource planning platform for Asha Builders — construction, CRM, HRMS, finance, inventory, and compliance in one monorepo.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS 11, Prisma ORM, PostgreSQL 16, Redis 7 |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| **Auth** | Auth.js (NextAuth v5) with email/password + role-based access |
| **Testing** | Jest (unit/integration), Playwright (E2E) |
| **Infra** | Docker multi-stage builds, Docker Compose, GitHub Actions CI |

## Project Structure

```
dashboard/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── common/       # Guards, decorators, DTOs, auth/permissions
│   │   │   ├── modules/      # 38 domain modules
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── Dockerfile
│   └── web/          # Next.js frontend (port 3000)
│       ├── src/app/          # App Router pages
│       ├── src/components/   # Shared UI components
│       ├── src/hooks/api/    # React Query hooks (48)
│       ├── e2e/              # Playwright tests (20 files)
│       └── Dockerfile
├── scripts/          # Dev runner, DB backup/restore
├── docs/             # Production runbook, release checklist, SRS
└── docker-compose.yml
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (port 5433) or Docker
- Redis (optional, for caching)

### Setup

```bash
# Clone and install
git clone <repo-url> && cd dashboard
npm install

# Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edit apps/api/.env — set DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY

# Start database (if not using local Postgres)
docker compose -f docker-compose.yml up -d postgres redis

# Push schema + seed
npx prisma db push --schema=apps/api/prisma/schema.prisma
npx tsx apps/api/prisma/seed.ts

# Start dev servers (API + Web concurrently)
npm run dev
```

The API runs at `http://localhost:4000` and the web app at `http://localhost:3000`.

### Default Login

| Email | Password | Role |
|---|---|---|
| admin@company.com | Admin@123 | OWNER (full access) |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API + Web concurrently |
| `npm run build` | Build both apps for production |
| `npm run lint:all` | Lint both apps |
| `npm run test:all` | Run API unit + E2E tests |
| `npm run verify` | Lint + build + test (full CI check) |
| `npm run docker:up` | Production Docker stack |
| `npm run db:seed` | Seed database |
| `npm run db:backup` | Backup PostgreSQL |

## RBAC System

8 roles with granular permission-based access control:

| Role | Scope |
|---|---|
| **OWNER** | Full access — bypasses all guards |
| **ADMIN** | All permissions (same as OWNER) |
| **HR_MANAGER** | HR modules, assets, training, meetings, agreements |
| **MANAGER** | Team management, projects, CRM read, designations |
| **TEAM_LEAD** | Project tasks, CRM, employees, training, meetings |
| **EMPLOYEE** | Own profile, tasks, training, meetings |
| **FIELD_EMPLOYEE** | Site visits, attendance, attendance-regularization |
| **ACCOUNTS** | Finance, payroll, invoices, payments |

115 permission constants across 38 modules. Permissions checked via `@RequirePermissions()` decorator on every endpoint.

## Docker Deployment

```bash
# Copy and configure production env
cp .env.production.example .env
# Edit .env — set all required secrets

# Build and start
docker compose build
docker compose up -d

# Verify
curl http://localhost:4000/api/health
# Open http://localhost:3000/sign-in
```

See [docs/production/runbook.md](docs/production/runbook.md) for full deployment procedures, backup/restore, and post-handoff steps.

## Testing

```bash
# Unit tests (API)
npm run test --workspace=apps/api

# E2E tests (API)
npm run test:e2e --workspace=apps/api

# Playwright tests (Web)
npm run test:e2e --workspace=apps/web

# Full test suite
npm run test:all
```

CI runs on every push/PR via GitHub Actions: lint, typecheck, build, unit tests, API E2E tests.

## Environment Variables

See [`.env.example`](.env.example) for local development and [`.env.production.example`](.env.production.example) for production deployment.

Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Auth.js session secret (min 32 chars)
- `ENCRYPTION_KEY` — Data encryption key (min 32 chars)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — Initial admin credentials

## License

Private — Asha Builders internal use only.

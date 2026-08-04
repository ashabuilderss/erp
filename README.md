# Asha Builders ERP

Private enterprise resource planning platform for Asha Builders. It combines CRM, construction operations, HRMS, attendance evidence, tasks, approvals, payroll, finance, inventory, documents, and reporting in one application.

## Architecture

| Component | Technology | Production host |
| --- | --- | --- |
| Web application | Next.js 16, React 19, Auth.js, Tailwind CSS | Vercel |
| API | NestJS 11, Prisma | Render |
| Database | PostgreSQL | Render Postgres |
| Realtime | Socket.IO | Render API |

The browser uses the Vercel web application. Its server-side proxy and authentication routes call the Render API through `API_URL`; direct sign-in and real-time connections use `NEXT_PUBLIC_API_URL`.

## Local development

Prerequisites: Node.js 20 or later, PostgreSQL 16, and optionally Redis 7.

```bash
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL, AUTH_SECRET, and ENCRYPTION_KEY in .env.
npx prisma db push --schema=apps/api/prisma/schema.prisma
npm run prisma:seed --workspace=apps/api
npm run dev
```

The API runs at `http://localhost:4000` and the web app at `http://localhost:3000`.

## Validation

```bash
npm run lint:all
npx prisma generate --schema=apps/api/prisma/schema.prisma
npm run build
npm run test --workspace=apps/api -- --runInBand
```

API end-to-end tests require an available PostgreSQL instance and seeded test data. Web end-to-end tests require both applications running.

## Production deployment

### 1. Render API and PostgreSQL

Create a Render Blueprint from `render.yaml` in the private GitHub repository. The Blueprint creates:

- `dashboard-api`, a public Node web service with `/api/health` health checks.
- `dashboard-postgres`, the managed PostgreSQL database.

Before the first deploy, configure these Render service variables in the dashboard (never in Git):

- `AUTH_SECRET` — random value, at least 32 characters; use the exact same value in Vercel.
- `ENCRYPTION_KEY` — random value, at least 32 characters.
- `FRONTEND_URL` — final Vercel production URL without a trailing slash.
- `SEED_COMPANY_NAME`, `SEED_COMPANY_SLUG`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` — one-time owner account details supplied by the owner. Rotate the password immediately after first login and remove it from Render.

Migrations run safely before each API start. The initial seed runs once through Render's initial-deploy hook and rejects placeholder production credentials.

### 2. Vercel web application

Import the same private repository into the **ABC builders** Vercel team. Set the Vercel project Root Directory to `apps/web`; the project configuration is in `apps/web/vercel.json`.

Set these Vercel production environment variables:

- `AUTH_SECRET` — the exact shared Render value.
- `AUTH_URL` — the Vercel production URL, without a trailing slash.
- `AUTH_TRUST_HOST` — `true`.
- `API_URL` — the Render API origin, for example `https://dashboard-api.onrender.com`.
- `NEXT_PUBLIC_API_URL` — the same Render API origin, for direct sign-in and Socket.IO.
- Optional Sentry values: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `NEXT_PUBLIC_SENTRY_DSN`.

After the first Vercel deployment provides its URL, update Render `FRONTEND_URL` to that value and redeploy the API. Then verify:

```text
https://<render-api>/api/health
https://<vercel-web>/sign-in
```

## Free-tier limits

Render free web services can spin down after 15 minutes of inactivity and have ephemeral local storage. Free Render Postgres expires after 30 days and has no backups. This setup is suitable for an initial demonstration, not a durable business production environment. Upgrade the database and API before operational use.

## Security

- `.env` files are ignored and must never be committed.
- Use separate secrets for each environment; share only `AUTH_SECRET` between the API and web application.
- Do not use seed defaults in production. Change the initial owner password immediately after first sign-in.

## License

Private — Asha Builders internal use only.

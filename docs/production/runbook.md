# Production Runbook

## Required Secrets

- `AUTH_SECRET`: random 32-byte minimum secret shared by web and API.
- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `FRONTEND_URL`: public web origin allowed by API CORS.
- `AUTH_URL`: public web origin used by NextAuth.
- `AUTH_TRUST_HOST`: set to `true` behind a trusted reverse proxy.
- `ENCRYPTION_KEY`: random 32-byte minimum key if encryption-backed features are enabled.

## One-Time Seed Handoff Values

- `SEED_COMPANY_NAME`: initial owner company display name.
- `SEED_COMPANY_SLUG`: initial owner company slug.
- `SEED_ADMIN_EMAIL`: initial owner admin email address.
- `SEED_ADMIN_PASSWORD`: temporary owner admin password, rotated immediately after first login.

Provide these values only for the initial production seed. Remove or disable the temporary seed password after the owner account is created and verified.

Production seed behavior is a release gate, not an assumption about the current seed script. Owner handoff is blocked until `apps/api/prisma/seed.ts` consumes these environment variables, rejects default or placeholder seed values when `NODE_ENV=production`, and avoids logging `SEED_ADMIN_PASSWORD`.

## First Deployment

The migration, seed, build, and release-verification commands in this runbook are production release gates created or verified by the production readiness tasks before owner handoff. If any command is missing or unverified in an intermediate branch, owner handoff is not complete.

1. Create production database.
2. Configure the environment variables from `.env.production.example`.
3. Run database migrations with `npm.cmd run prisma:migrate:deploy --workspace=apps/api`.
4. Run seed only for the initial owner/admin account with `npm.cmd run prisma:seed --workspace=apps/api`.
5. Build API with `npm.cmd run build --workspace=apps/api`.
6. Build web with `npm.cmd run build --workspace=apps/web`.
7. Start API with `npm.cmd run start:prod --workspace=apps/api`.
8. Start web with `npm.cmd run start --workspace=apps/web`.

## Docker Deployment

This section is valid after Docker production verification and hardening are complete. Before owner handoff, production Compose must consume the production environment values instead of checked-in defaults or hardcoded development values.

1. Copy `.env.production.example` to `.env` and replace every placeholder.
2. Run `docker compose build`.
3. Run `docker compose up -d`.
4. Confirm API health at `http://localhost:4000/api/health`.
5. Confirm web login at `http://localhost:3000/sign-in`.

## Backup and Restore

Record required inputs before owner handoff: production database source, restore target, backup storage location, access owner, RPO, RTO, retention period, and restore-test owner.

For self-managed PostgreSQL, create a custom-format backup:

```sh
pg_dump --format=custom --no-owner --file=backup.dump "$DATABASE_URL"
```

Restore only to an isolated database, never over production:

```sh
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" backup.dump
```

For SQL backups, use the equivalent plain dump and restore flow:

```sh
pg_dump --format=plain --no-owner "$DATABASE_URL" > backup.sql
psql "$RESTORE_DATABASE_URL" < backup.sql
```

For managed PostgreSQL, use the provider's snapshot, point-in-time recovery, or export workflow, then restore to an isolated instance with equivalent validation.

After restore, validate database connectivity, migration state, tenant isolation sample records, owner company/admin presence, and API health against the restored database. Record evidence with date, operator, source backup or snapshot, restore target, validation results, RPO, RTO, and retention.

## Post-Handoff Actions

1. Owner logs in with the temporary admin password.
2. Owner changes the admin password immediately.
3. Deployer stores secrets in the production secret manager.
4. Deployer enables database backups.
5. Deployer records restore-test evidence.

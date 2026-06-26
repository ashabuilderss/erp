# Production Tracker

Date: 2026-06-17

## Current Verdict

Phase 9 and Phase 10 are implemented and compile. The project is owner-demo ready only if the API and database are running locally. It is not final production ready yet because database migrations, Docker/runtime verification, browser E2E, and lint-warning cleanup still need closure.

## Phase 9 - Security, Sessions, Upload Policy

| Item | Status | Evidence |
| --- | --- | --- |
| Login attempt tracking | Done | `LoginAttempt` model and auth login recording added |
| Session tracking | Done | `UserSession` model and refresh-token session creation added |
| Security event audit | Done | `SecurityEvent` model, API endpoints, CSV export |
| 2FA foundation | Done with limitation | Placeholder-safe setup/disable exists; TOTP verification intentionally refuses to enable until a real TOTP provider is added |
| Upload policy | Done | 25MB max; JPG/PNG/WEBP/PDF/DOCX/MP3/WEBM/DWG policy; image uploads remain image-only |
| Upload source handoff | Fixed | `.gitignore` now unignores `apps/api/src/modules/uploads/**` |

## Phase 10 - Reports, WhatsApp, Incentives

| Item | Status | Evidence |
| --- | --- | --- |
| Report catalog/export history | Done | `/reports/catalog`, `/reports/exports` API and dashboard report UI |
| WhatsApp templates/logs | Done | Mock/provider-ready template and send-log flow; `MOCKED` without provider token, `QUEUED` with provider token |
| Incentive announcements | Done | Owner/admin create/list/update; employee active announcements |
| Dashboard navigation | Done | Added Reports, Incentives, WhatsApp, Security routes/pages |
| Web production build | Passed | `npm.cmd run build --workspace=apps/web` generated 43 routes including `/dashboard/security`, `/dashboard/incentives`, `/dashboard/whatsapp` |

## Sample Users

These are local/demo seed users only. Do not use these passwords in production.

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@company.com` | `Owner@123` |
| Admin | `admin@company.com` | `Admin@123` |
| HR Manager | `hr@company.com` | `Hr@12345` |
| Employee | `sales@company.com` | `Sales@12345` |
| Employee | `agent@company.com` | `Agent@12345` |
| Employee | `ops@company.com` | `Ops@12345` |

## Verification Evidence

| Check | Result | Notes |
| --- | --- | --- |
| `npm.cmd run prisma:generate --workspace=apps/api` | Passed | Prisma Client generated for Phase 9/10 schema |
| `npx.cmd tsc -p tsconfig.build.json --noEmit` in `apps/api` | Passed | Fixed stale `LEAVE` attendance-status usage |
| `npm.cmd run build --workspace=apps/api` | Passed | `nest-cli.json` no longer deletes locked `dist` on Windows before compile |
| `npm.cmd run build --workspace=apps/web` | Passed | Next.js production build completed |
| `npm.cmd test --workspace=apps/api -- --runInBand` | Passed | 17/17 unit tests |
| `npm.cmd test --workspace=apps/api -- file-policy.service.spec.ts security.service.spec.ts --runInBand` | Passed | 5/5 focused Phase 9 tests |
| `npm.cmd run lint --workspace=apps/api` | Passes with warnings | 0 errors, 182 warnings remain |
| `npm.cmd run lint --workspace=apps/web` | Passes with warnings | 0 errors, 71 warnings remain |
| Browser check | Blocked for full E2E | Frontend responds at `http://localhost:3000`, API health at `http://localhost:4000/api/health` was unreachable, dashboard rendered blank while API was down |

## Production Blockers

1. Add and verify a real Prisma migration for the Phase 9/10 schema changes. Current Docker compose uses `prisma db push --accept-data-loss`, which is not a production migration strategy.
2. Start API and database, then run browser E2E login and owner workflow testing.
3. Verify Docker build/up with the real Docker daemon.
4. Clean remaining lint warnings before calling the handoff pristine.
5. Replace placeholder 2FA with a real TOTP implementation before advertising 2FA as complete.
6. Configure real WhatsApp provider credentials and delivery callbacks before using it for live customer messages.

## Owner Handoff Answer

Not ready as final production. It is ready for an internal owner demo after starting API/database and seeding demo data. For production owner handoff, close the blockers above first.

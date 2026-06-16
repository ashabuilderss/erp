# Stabilization Tracker

Date: 2026-06-15

## Goal

Prepare the RealEstate CRM project for an owner handoff by fixing concrete blockers, verifying the running app, and recording evidence.

## Scope

- Fix high-risk frontend correctness issues found in lint and browser testing.
- Fix visible runtime/UX problems found in dashboard and navigation.
- Add missing deployment files referenced by `docker-compose.yml`.
- Run fresh verification commands and browser checks.
- Give an honest readiness verdict.

## Work Items

| Item | Status | Evidence |
| --- | --- | --- |
| Create tracker | Done | `TRACKER.md` created and updated |
| Fix conditional React hooks in attendance page | Done | `npm.cmd run lint --workspace=apps/web -- --quiet` exits 0 |
| Reduce frontend lint blockers to a handoff-safe level | Done with debt | Final verify reports web lint `170 problems (0 errors, 170 warnings)` |
| Fix dashboard chart sizing/runtime warnings | Done for production smoke | In-app browser production smoke reaches `/dashboard`, visits core pages, and reports 0 console errors |
| Fix sidebar icon fallback for My Tasks | Done | `CheckSquare` added to sidebar icon map |
| Improve empty/loading table status text | Done | Browser properties page shows stable empty results text |
| Add Dockerfiles referenced by compose | Done | `apps/api/Dockerfile` and `apps/web/Dockerfile` exist |
| Fix production auth host configuration | Done | Built app login works with `AUTH_URL` and `AUTH_TRUST_HOST` |
| Verify backend health | Passed | `Invoke-WebRequest http://localhost:4000/api/health` returns `200` |
| Verify frontend build | Passed | `npm.cmd run build --workspace=apps/web` compiles and generates 22 static pages |
| Verify API build | Passed | `npm.cmd run build --workspace=apps/api` exits 0 after Prisma generation |
| Verify API unit tests | Passed | Final verify reports seed-config suite `10 passed, 10 total` |
| Verify API e2e tests | Passed | Final verify reports `5 passed, 5 total` suites and `9 passed, 9 total` tests |
| Verify authenticated browser flow | Passed | In-app browser login reaches `http://localhost:3103/dashboard`; core pages load with 0 console errors |
| Add production runbook and release checklist | Done | `docs/production/runbook.md` and `docs/production/release-checklist.md` updated |
| Add root verification scripts | Done | Root `verify`, `lint:all`, `test:all`, and Docker helper scripts added |
| Harden production seed flow | Done | Production seed requires explicit values, rejects local defaults/placeholders, and refuses to reset an existing company |
| Add web browser e2e suite | Done | Production-mode `npm.cmd run test:e2e --workspace=apps/web -- --project=chromium` passes 4 Playwright tests via Edge channel |
| Migrate Next middleware to proxy convention | Done | `apps/web/src/proxy.ts` exists; `apps/web/src/middleware.ts` removed |
| Fix production web API proxy session bridge | Done | Web proxy uses `auth()` session data before signing backend JWT; production e2e login passes |
| Harden Docker Compose env contract | Done | `docker compose config` exits 0 with required production env values supplied |
| Verify root production gate | Passed with warnings tracked | `npm.cmd run verify` exits 0 after dependency repair and Prisma generation |
| Verify clean install gate | Blocked in this running environment | `npm.cmd ci` fails with `EPERM` unlinking locked `node_modules\bcrypt\prebuilds\win32-x64\bcrypt.node` |
| Verify Docker build/run gate | Blocked in this environment | `docker compose build` fails because `npipe:////./pipe/docker_engine` is missing; Docker daemon/Desktop is not running |

## Remaining Debt

- Frontend lint exits 0 but reports 170 warnings in the final `npm.cmd run verify` output.
- API lint exits 0 but reports 149 warnings in the final `npm.cmd run verify` output.
- Strict zero-warning lint is not complete; warning-level gates are being used to keep verification runnable.
- Clean `npm.cmd ci` was attempted but blocked by a Windows file lock on the running API's bcrypt native module. Re-run with local Node/API processes stopped.
- Docker Compose config renders, but Docker image build/run is blocked until Docker Desktop/daemon is running.
- Owner acceptance still needs production-environment checks for Docker startup, secret rotation, backup/restore, and manual role/CRUD acceptance.
- Git handoff is not auditable yet: this repository currently has no committed baseline and `git status --short --untracked-files=all` reports the project as untracked.

## Production Plan

- Plan saved at `docs/superpowers/plans/2026-06-14-production-readiness.md`.
- Production completion requires passing API e2e tests, web browser e2e tests, strict lint, Docker Compose verification, secret rotation, and owner runbook verification.

## Final Production Verification

Date: 2026-06-15

| Gate | Result | Evidence |
| --- | --- | --- |
| Clean install | Blocked | `npm.cmd ci` exits `-4048` with `EPERM` unlinking `node_modules\bcrypt\prebuilds\win32-x64\bcrypt.node` while the local API is running |
| Dependency repair | Passed | `npm.cmd install --no-audit --no-fund` exits 0; cleanup warning remains for a locked temporary bcrypt folder |
| Prisma client generation | Passed | `npm.cmd run prisma:generate --workspace=apps/api` exits 0 |
| Root verify | Passed | `npm.cmd run verify` exits 0 |
| Web lint | Passed with debt | Final verify reports `170 problems (0 errors, 170 warnings)` |
| API lint | Passed with debt | Final verify reports `149 problems (0 errors, 149 warnings)` |
| API unit tests | Passed | Final verify reports seed-config suite `10 passed, 10 total` |
| API e2e | Passed | Final verify reports `5 passed, 5 total` suites and `9 passed, 9 total` tests |
| Local seed restore | Passed | `npm.cmd run prisma:seed --workspace=apps/api` exits 0 after final API e2e reset |
| Web production e2e | Passed | `WEB_E2E_SERVER_MODE=production npm.cmd run test:e2e --workspace=apps/web -- --project=chromium` exits 0 with `4 passed` |
| In-app browser smoke | Passed | Browser login reaches dashboard, visits properties/leads/customers/bookings/employees/attendance/leave requests/settings, and captures `0` console errors |
| Docker Compose config | Passed | `docker compose config` exits 0 with required production env values supplied |
| Docker build | Blocked | `docker compose build` cannot connect to `npipe:////./pipe/docker_engine`; Docker daemon/Desktop is not running |
| Docker run | Blocked | Not run because Docker image build is blocked |

## Owner Handoff Verdict

Ready for owner demo or technical review on this machine. Not ready for final production owner handoff until Docker build/run is verified on a running Docker daemon, `npm.cmd ci` passes with local Node/API processes stopped, lint warnings are either cleaned or formally accepted, production secrets are rotated, backups/restore are verified, and the work is committed or packaged from an auditable Git state.

# Release Checklist

The `verify` and `test:e2e` commands are production release gates created or verified by the production readiness tasks before owner handoff. Missing or failing release-gate commands block release.

- [x] `npm.cmd run verify` passes from the repository root.
- [x] `npm.cmd run test:e2e --workspace=apps/api` passes against a clean test database.
- [x] `npm.cmd run test:e2e --workspace=apps/web` passes against the running production build.
- [ ] `docker compose build` passes.
- [ ] `docker compose up -d` starts `postgres`, `api`, and `web`.
- [x] API health returns HTTP 200 from `/api/health`.
- [x] Admin can log in and view dashboard charts.
- [ ] Admin can create a property, lead, customer, employee, attendance entry, and leave allocation in the browser.
- [x] Employee role can only see assigned/allowed data in API e2e coverage.
- [x] Cross-company records are not visible across tenant boundaries in API e2e coverage.
- [ ] Production secrets are not copied from local development.
- [ ] Database backup and restore instructions are verified.
- [x] `TRACKER.md` contains final evidence and owner handoff verdict.

## Blocked Items

- `npm.cmd ci` was attempted on 2026-06-15 and failed with `EPERM` on a locked bcrypt native module while the local API was running. Re-run after stopping local Node/API processes.
- `docker compose build` was attempted on 2026-06-15 and failed because Docker daemon/Desktop was not running (`npipe:////./pipe/docker_engine` missing).
- Browser-level owner CRUD acceptance, production secret rotation, and database backup/restore verification still need to be performed in the real deployment environment.

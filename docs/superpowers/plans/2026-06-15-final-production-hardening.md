# Final Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining owner-handoff blockers: Docker verification, clean install, strict lint, production secrets/docs, and Git handoff.

**Architecture:** Keep the existing Next.js web app, NestJS API, Prisma/Postgres backend, and Docker Compose deployment. Harden release gates without changing product behavior unless a verification failure proves a bug.

**Tech Stack:** Next.js 16, React 19, NestJS 11, Prisma 7, PostgreSQL 16, Jest, Playwright, Docker Compose, Git.

---

## Task 1: Docker Daemon and Compose Verification

**Files:**
- Modify only if verification proves a Compose/Dockerfile bug: `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`
- Update: `TRACKER.md`, `docs/production/release-checklist.md`

- [ ] Start Docker Desktop.
- [ ] Wait for `docker info` to return successfully.
- [ ] Run `docker compose config` with production-like placeholder secrets.
- [ ] Run `docker compose build`.
- [ ] Run `docker compose up -d`.
- [ ] Verify `docker compose ps`, API health, and web sign-in route.
- [ ] Run `docker compose down` when verification is complete unless the user asks to keep it running.

## Task 2: Clean Install Reproducibility

**Files:**
- Modify if needed: root `package.json`, root `package-lock.json`, `apps/api/package.json`, `apps/web/package.json`
- Update: `TRACKER.md`, `docs/production/release-checklist.md`

- [ ] Stop project-owned Node processes that are locking native modules.
- [ ] Run `npm.cmd ci`.
- [ ] If Prisma client is missing after install, encode generation in the install/build workflow instead of relying on manual recovery.
- [ ] Run `npm.cmd run verify`.

## Task 3: Strict Lint Cleanup

**Files:**
- Modify files reported by `npm.cmd run lint --workspace=apps/web -- --max-warnings=0`
- Modify files reported by `npm.cmd run lint --workspace=apps/api -- --max-warnings=0`
- Modify lint config only to make rules stricter, not looser.

- [ ] Capture current web warning categories.
- [ ] Fix web warnings by category and verify `npm.cmd run lint --workspace=apps/web -- --max-warnings=0`.
- [ ] Capture current API warning categories.
- [ ] Fix API warnings by category and verify `npm.cmd run lint --workspace=apps/api -- --max-warnings=0`.

## Task 4: Production Secrets and Handoff Docs

**Files:**
- Modify: `.env.production.example`
- Modify: `docs/production/runbook.md`
- Modify: `docs/production/release-checklist.md`
- Modify: `TRACKER.md`

- [ ] Verify the production env template contains no usable local secret.
- [ ] Ensure the runbook explains secret generation, rotation, Docker env requirements, seed placeholders, and backup/restore.
- [ ] Ensure the release checklist records the real verification state.

## Task 5: Git Handoff

**Files:**
- Modify: `.gitignore` if generated artifacts are still visible
- Stage and commit all intended source/docs/config files.

- [ ] Verify `.env`, `.next`, `node_modules`, Playwright reports, test results, build output, and temporary logs are ignored.
- [ ] Stage intended files.
- [ ] Create an initial production-readiness commit if Git permissions allow.
- [ ] If Git write access is blocked, record the permission blocker and exact next command.

## Final Gate

- [ ] Run `npm.cmd ci`.
- [ ] Run `npm.cmd run verify`.
- [ ] Run production-mode web e2e.
- [ ] Run Docker Compose build/up/health if daemon is available.
- [ ] Update `TRACKER.md` with final evidence.

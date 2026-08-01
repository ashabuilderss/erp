# ASHA BUILDERS ERP — Defect Remediation & Deployment-Readiness Plan

**Document ID:** `IMPLEMENTATION_PLAN.md`
**Created:** 2026-07-28
**Based on:** Verified audit findings from `E2E_SOFTWARE_AUDIT_REPORT.md`
**Goal:** Fix all critical/major defects and achieve deployment readiness within ~6-7 hours
**Constraint:** Must preserve dataflow integrity, SRS compliance, and security invariants

---

## Audit Verification Summary

The original audit report claimed **6 critical, 12 major, 18 minor** defects. After deep codebase verification:

| Original Claim | Verified Result |
|---|---|
| CRITICAL-02 (Missing half-day rule) | **REFUTED** — Rule exists in `attendance-policy.engine.ts:65-70` with configurable thresholds |
| MAJOR-06 (No quotation PDF watermarks) | **PARTIALLY REFUTED** — Quotation-specific PDFs HAVE watermarks (`quotation-pdf.service.ts:57-66`). Generic report PDFs do not. |
| All other critical/major claims | **CONFIRMED** |

### Additional Vulnerabilities Found (Not in Original Report)

| ID | Severity | Description |
|---|---|---|
| EXTRA-01 | Critical | `.env` files contain real production secrets (`AUTH_SECRET`, `ENCRYPTION_KEY`, `REDIS_PASSWORD`, `POSTGRES_PASSWORD`) — may be tracked in git |
| EXTRA-02 | High | `temp_*.sql` files NOT in `.gitignore` — will be committed on next push |
| EXTRA-03 | Medium | No sensitive data scrubbing in `LoggingInterceptor` or `AuditLogInterceptor` (passwords, tokens, TOTP secrets logged verbatim) |
| EXTRA-04 | Medium | No acknowledgement SLA timeout for warnings — unacknowledged warnings never escalate to Owner |
| EXTRA-05 | Medium | `TaskOverdueListener` always issues `LEVEL_1_VERBAL` regardless of escalation stage — severity never escalates |
| EXTRA-06 | Medium | No Owner/HR notification when payroll hold blocks an employee during payroll run |
| EXTRA-07 | Low | Password complexity not enforced (only `@MinLength(8)`, no uppercase/digit/special requirements) |
| EXTRA-08 | Low | `Warning.acknowledgedAt` is mutable — can be overwritten on re-acknowledgment |

---

## Implementation Phases

### Phase 0: Security & Repository Hygiene (30 minutes)

**Goal:** Eliminate secrets exposure and unnecessary attack surface before touching any business logic.

| # | Task | Files | Details |
|---|---|---|---|
| 0.1 | Remove `.env` files from git tracking | `.gitignore`, root | Run `git rm --cached .env apps/api/.env apps/web/.env.local`. Add `*.sql` to `.gitignore`. Verify with `git ls-files --cached | findstr ".env"` |
| 0.2 | Add `temp_*.sql` to `.gitignore` | `.gitignore` | Add `temp_*.sql` pattern. Run `git rm --cached temp_*.sql` |
| 0.3 | Remove `PortalsModule` | `app.module.ts`, `portals/` | Remove import and registration from `app.module.ts:23,73`. Delete `modules/portals/` directory. This removes out-of-scope endpoints (`POST /complaints` etc.) |
| 0.4 | Add sensitive data scrubbing to `LoggingInterceptor` | `logging.interceptor.ts` | Create `sanitizeLogData()` utility that redacts `password`, `token`, `authorization`, `secret`, `hashedPassword`, `totpSecret`, `ENCRYPTION_KEY` from request bodies and URLs before logging |
| 0.5 | Add sensitive field redaction to `AuditLogInterceptor` | `audit-log.interceptor.ts:125-134` | Modify `extractAfterValues()` to strip `hashedPassword`, `totpSecret`, `ENCRYPTION_KEY`, `secret` fields before persisting to `activity_logs` |

**Verification:** `git status` shows no `.env` or `temp_*.sql` files tracked. PortalsModule endpoints return 404.

---

### Phase 1: Database Schema Fixes (1.5 hours)

**Goal:** Fix all schema-level violations. This is the foundation — all subsequent phases depend on correct schema.

#### 1A: Add `companyId` to 14 Missing Tables

**Migration:** `20260728_add_company_id_to_isolated_tables`

| Table | Approach | Migration SQL |
|---|---|---|
| `ApprovalHistory` | FK via `ApprovalRequest.companyId` | `ALTER TABLE approval_histories ADD COLUMN "companyId" TEXT; UPDATE approval_histories ah SET "companyId" = ar."companyId" FROM approval_requests ar WHERE ah."requestId" = ar."id"; ALTER TABLE approval_histories ALTER COLUMN "companyId" SET NOT NULL;` |
| `ApprovalStep` | FK via `ApprovalRequest.companyId` | Same pattern via `requestId → approval_requests` |
| `ApprovalTemplateStep` | FK via `ApprovalTemplate.companyId` | Via `templateId → approval_templates` |
| `DomainEvent` | Add column (events carry payload with entityId) | `ALTER TABLE domain_events ADD COLUMN "companyId" TEXT;` — populate from `entityType`/`entityId` lookups in backfill script |
| `PayrollHoldHistory` | FK via `PayrollHold.companyId` | Via `holdId → payroll_holds` |
| `Permission` | **SKIP** — Permissions are global by design (shared across all companies). Adding `companyId` here would break the RBAC system. | N/A |
| `ProcessedEvent` | **SKIP** — Event deduplication table, events identified by globally unique `eventId`. Adding `companyId` adds no isolation value. | N/A |
| `RecurringSchedule` | FK via `TaskTemplate.companyId` | Via `templateId → task_templates` |
| `TaskExtension` | FK via `Task.companyId` | Via `taskId → tasks` |
| `TaskHistory` | FK via `Task.companyId` | Via `taskId → tasks` |
| `TaskProof` | FK via `Task.companyId` | Via `taskId → tasks` |
| `WarningHistory` | FK via `Warning.companyId` | Via `warningId → warnings` |
| `AgreementApproval` | FK via `Agreement.companyId` | Via `agreementId → agreements` |
| `InventoryTransaction` | FK via `InventoryItem.companyId` | Via `itemId → inventory_items` |

**Prisma schema changes:** Add `companyId String` + `companies Company @relation(...)` + `@@index([companyId])` to each model (except Permission and ProcessedEvent).

**Service-layer changes:** Every query in services that touch these tables MUST add `companyId` filter. Key files to update:
- `approvals-runtime.service.ts`, `approvals-history.service.ts`
- `task-escalation.worker.ts`, `tasks.service.ts`
- `hold-activation.listener.ts`, `hold-release.service.ts`
- `warnings.service.ts`, `warning-expiration.worker.ts`
- `inventory.service.ts`
- `governance-event.publisher.ts` (DomainEvent)

#### 1B: Remove `deletedAt` from Append-Only Tables

| Table | Schema Change |
|---|---|
| `WarningHistory` | Remove `deletedAt DateTime?` field |
| `PayrollHoldHistory` | Remove `deletedAt DateTime?` field |
| `AuditRecord` | Remove `deletedAt DateTime?` field (at `schema.prisma:2437`) |
| `DeletionLog` | Remove `deletedAt DateTime?` field (at `schema.prisma:2459`) |
| `ExportLog` | Remove `deletedAt DateTime?` if present |
| `DownloadLog` | Remove `deletedAt DateTime?` if present |

**Impact:** No code currently soft-deletes these tables (verified — all operations are `.create()` only), so removing the column is safe.

#### 1C: Create `WarningAcknowledgement` Append-Only Table

```prisma
model WarningAcknowledgement {
  id          String   @id @default(cuid())
  warningId   String
  companyId   String
  employeeId  String
  acknowledgedAt DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  comments    String?

  warnings   Warning @relation(fields: [warningId], references: [id])
  companies  Company @relation(fields: [companyId], references: [id])
  employees  Employee @relation(fields: [employeeId], references: [id])

  @@index([warningId])
  @@index([companyId])
  @@index([employeeId])
  @@map("warning_acknowledgements")
}
```

**No `deletedAt`. No UPDATE operations allowed.** This is strictly append-only.

#### 1D: Add `CANCELLED` to `TaskStatus` Enum

```prisma
enum TaskStatus {
  PENDING
  IN_PROGRESS
  PENDING_VALIDATION
  COMPLETED
  OVERDUE
  CANCELLED    // NEW
}
```

#### 1E: Add Photo Fields to `EodReport`

```prisma
model EodReport {
  // ... existing fields ...
  photoUrls   String[]  // Array of S3 URLs for uploaded photos
}
```

#### 1F: Run Migration

```bash
cd apps/api
npx prisma migrate dev --name 20260728_defect_remediation
```

**Verification:** `npx prisma validate` passes. All 96+ models compile. Migration SQL applies cleanly.

---

### Phase 2: Critical Business Logic Fixes (2 hours)

**Goal:** Fix all critical business logic defects that impact payroll accuracy, security, and audit integrity.

#### 2.1: Make Attendance Nonce Mandatory (CRITICAL-06)

**File:** `apps/api/src/modules/hrms/attendance/attendance.service.ts:165-172`

**Current (BROKEN):**
```typescript
// 3.2 Server Nonce Validation (skip when no nonce provided — web dashboard doesn't use nonces)
if (dto.nonce) {
  const nonceKey = `attendance:nonce:${companyId}:${employeeId}`;
  const storedNonce = await this.redis.get<string>(nonceKey);
  if (!storedNonce || dto.nonce !== storedNonce) {
    throw new BadRequestException('Invalid or expired nonce');
  }
  await this.redis.del(nonceKey);
}
```

**Fix:** Remove the `if (dto.nonce)` guard. Nonce is now ALWAYS required. Update the DTO to remove `optional` from the nonce field. Update the frontend attendance punch flow to always fetch a nonce first.

**File changes:**
- `attendance.service.ts:165-172` — Remove conditional, always validate
- `dto/punch.dto.ts:24,47,73` — Change `nonce?: string` to `nonce: string`
- Frontend: Ensure attendance check-in calls `/attendance/nonce/generate` before submitting punch

#### 2.2: Remove Offline Sync from Attendance (CRITICAL-05)

**File:** `apps/api/src/modules/hrms/attendance/attendance.service.ts:121-234`

**Current:** `clientGeneratedUuid` is used to deduplicate attendance punches, enabling offline queue submissions.

**Fix:**
- Remove `clientGeneratedUuid` from DTO (`punch.dto.ts:85`)
- Remove deduplication logic (`attendance.service.ts:134-137`)
- Remove `clientGeneratedUuid` from create call (`attendance.service.ts:234`)
- Remove the column from Prisma schema (`schema.prisma:331`)
- Create migration to drop the column

**Frontend:** Remove any offline queue logic for attendance. Attendance must always submit online.

#### 2.3: Fix Task Cancellation (MAJOR-11, MAJOR-12)

**File:** `apps/api/src/modules/tasks/tasks.service.ts:142-161`

**Current (BROKEN):**
```typescript
// "CANCELLED" isn't in TaskStatus. Let's map it or check schema.
// I will delete it for now since schema doesn't have CANCELLED.
await tx.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
```

**Fix:** (Depends on Phase 1D adding `CANCELLED` to enum)
```typescript
await tx.task.update({
  where: { id: taskId },
  data: { status: TaskStatus.CANCELLED, deletedAt: new Date() },
});
```

Also add `TaskHistory` entry for cancellation. Ensure `task-escalation.worker.ts` excludes `CANCELLED` tasks from escalation queries.

**Files to update:**
- `tasks.service.ts:142-161` — Use status instead of just soft delete
- `task-escalation.worker.ts` — Add `status !== TaskStatus.CANCELLED` filter
- `tasks.service.ts` — Add CANCELLED to any query that lists active tasks

#### 2.4: Make Audit Log Transactional (CRITICAL-03)

**File:** `apps/api/src/common/interceptors/audit-log.interceptor.ts`

**Current (BROKEN):** Audit log is written via `tap()` + `.catch()` — completely fire-and-forget, no atomicity with the business write.

**Fix:** This is architecturally complex because NestJS interceptors don't have access to the Prisma transaction client used by services. The recommended approach:

**Option A (Recommended):** Convert to a **post-commit hook pattern**:
1. Services that perform critical writes (payroll, warnings, attendance, employee lifecycle) should explicitly call `AuditService.create()` within their `$transaction` block
2. The `AuditLogInterceptor` remains as a fallback for non-critical writes
3. Add a `@AuditLog()` decorator for critical endpoints that signals the interceptor to throw if audit write fails (instead of swallowing)

**Option B (Quick fix for tonight):** At minimum, change the interceptor to **await** the audit log write instead of fire-and-forget:
```typescript
// Instead of:
this.saveAuditLog({...}).catch(e => this.logger.error(...));

// Use:
from(this.saveAuditLog({...})).subscribe({
  error: (e) => this.logger.error(`Failed to save audit log: ${e.message}`),
});
```

This still isn't transactional but at least doesn't silently swallow errors.

**Long-term:** Implement Option A with explicit transactional audit writes for critical modules.

#### 2.5: Fix Error Response Format (MAJOR-03)

**File:** `apps/api/src/common/filters/http-exception.filter.ts:47-51`

**Current:**
```typescript
response.status(status).json({
  statusCode: status,
  message,
  timestamp: new Date().toISOString(),
});
```

**Fix:**
```typescript
response.status(status).json({
  success: false,
  error: status,
  message,
  timestamp: new Date().toISOString(),  // Keep for debugging
});
```

**Also update the success response format** in any controller-level response builders to include `success: true`.

---

### Phase 3: Module Boundary & Governance Fixes (1 hour)

**Goal:** Fix architectural violations and missing governance features.

#### 3.1: Fix Cross-Module Imports (MAJOR-08)

**Pattern:** Multiple modules directly import `ApprovalsSpawningService` from the approvals module directory.

**Files to fix:**
- `warnings/warnings.service.ts:9` — `import { ApprovalsSpawningService } from '../approvals/approvals-spawning.service'`
- `payroll-holds/hold-release.service.ts:10`
- `payroll-holds/hold-recommendation.service.ts:5`
- `hrms/attendance-corrections/attendance-corrections.service.ts:9`
- `tasks/task-extension.service.ts:4`

**Fix:** These modules already import `ApprovalsModule` in their module definitions. The DI container resolves the service through exports. The file-path imports are redundant and create coupling. **Remove the direct file-path imports** — the DI-injected `ApprovalsSpawningService` is already available via the module's constructor injection.

**Before:**
```typescript
import { ApprovalsSpawningService } from '../approvals/approvals-spawning.service';
```

**After:** Remove the import line. The constructor already receives it via DI:
```typescript
constructor(private readonly spawningService: ApprovalsSpawningService) {}
```

This works because the module already imports `ApprovalsModule` which exports `ApprovalsSpawningService`.

#### 3.2: Add Warning Acknowledgement SLA Timeout (EXTRA-04)

**New file:** `apps/api/src/modules/warnings/warning-ack-sla.worker.ts`

**Logic:**
```
Cron: Every 30 minutes
1. Find all APPROVED warnings where:
   - acknowledgedAt IS NULL
   - createdAt + SLA_WINDOW < NOW()
2. For each unacknowledged warning past SLA:
   - Create WarningAcknowledgement record with event=SLA_EXPIRED
   - Emit WARNING_ACK_SLA_BREACHED domain event
   - Notify Owner via notification service
3. Log escalation in WarningHistory
```

**SLA Windows:**
- Level 1 Verbal: 48 hours
- Level 2 Written: 24 hours
- Level 3 Final: 12 hours

**Register in:** `warnings.module.ts` as a provider.

#### 3.3: Fix Warning Severity Escalation (EXTRA-05)

**File:** `apps/api/src/modules/tasks/task-overdue.listener.ts`

**Current:** Always issues `LEVEL_1_VERBAL` regardless of escalation stage.

**Fix:** Map escalation level to warning severity:
- Escalation Level 2 → `LEVEL_1_VERBAL`
- Escalation Level 3 → `LEVEL_2_WRITTEN`
- Escalation Level 4+ → `LEVEL_3_FINAL`

#### 3.4: Add Payroll Hold Notification (EXTRA-06)

**File:** `apps/api/src/modules/payroll-holds/payroll-evaluation.service.ts`

**Fix:** When `hasHold === true` and `FULL_HOLD` or `PARTIAL_HOLD` applies:
1. Create a notification to the Owner and HR Manager
2. Include: employee name, hold type, reason, amount affected
3. Use the existing `NotificationService` or domain event pattern

#### 3.5: Populate `companyId` on DomainEvent (CRITICAL-01 supplement)

**File:** `apps/api/src/modules/governance-events/governance-event.publisher.ts`

**Fix:** Ensure every `DomainEvent.create()` call includes `companyId` from the transaction context. Update the `publish()` method signature to accept and pass through `companyId`.

---

### Phase 4: Frontend & Integration Fixes (1 hour)

**Goal:** Update frontend to match backend schema changes.

#### 4.1: Add Photo Upload to EOD Reports (MAJOR-05)

**Frontend files:**
- `apps/web/src/app/dashboard/eod-reports/` — Add file upload component to EOD form
- Use existing `FileUpload` component from `components/ui/`

**Backend files:**
- `eod/dto/create-eod-report.dto.ts` — Add `photoUrls?: string[]` field
- `eod/eod-reports.service.ts` — Handle `photoUrls` in create/update
- Upload flow: Photos upload to S3 via existing `/uploads/general` endpoint, URLs saved to `photoUrls` array

#### 4.2: Add CANCELLED Status Handling

**Frontend files:**
- `apps/web/src/app/dashboard/tasks/` — Add "Cancel" action button for task owners/managers
- Task detail page — Show CANCELLED status badge
- Task list filters — Add CANCELLED filter option

#### 4.3: Update Attendance Flow for Mandatory Nonce

**Frontend files:**
- `apps/web/src/app/dashboard/attendance/` — Before punch submission:
  1. Call `GET /attendance/nonce/generate`
  2. Include returned nonce in punch submission payload

#### 4.4: Remove Offline Attendance Queue

**Frontend files:**
- Remove any IndexedDB / localStorage queue logic for attendance punches
- Show "No internet connection" error instead of queuing

#### 4.5: Update Error Handling for New Response Format

**Frontend files:**
- `apps/web/src/lib/api/` or axios interceptor — Update error parsing to handle `{ success, error, message }` format
- All API error handlers — Ensure they read `message` from the new format

---

### Phase 5: Testing & Verification (30 minutes)

**Goal:** Verify all fixes work and nothing is broken.

#### 5.1: Database Migration
```bash
cd apps/api
npx prisma migrate dev --name 20260728_defect_remediation
npx prisma generate
```

#### 5.2: Run Existing Test Suites
```bash
# API unit tests
cd apps/api && npm test

# API E2E tests
npm run test:e2e
```

#### 5.3: Manual Smoke Tests

| Test | Expected Result |
|---|---|
| Login as Owner | Dashboard loads, 2FA works |
| Punch attendance (office) | Nonce generated, punch submitted with nonce, record created |
| Punch attendance (field) | GPS + selfie + nonce required, record created |
| Create task with PENDING status | Task created |
| Cancel task | Status = CANCELLED, task visible in cancelled filter |
| Submit EOD report with photos | Report saved with photo URLs |
| Issue warning → acknowledge | WarningAcknowledgement record created (append-only) |
| Run payroll with held employee | Employee excluded, Owner/HR notified |
| Access `/complaints` via portals | 404 (PortalsModule removed) |
| Generate quotation PDF | Watermark visible with email + timestamp |
| Export report | Error response includes `success: false` field |

#### 5.4: Security Verification
```bash
# Verify .env not tracked
git ls-files --cached | findstr ".env"
# Should return empty

# Verify temp SQL not tracked
git ls-files --cached | findstr "temp_"
# Should return empty
```

---

## Execution Order & Dependencies

```
Phase 0 (Security) ─────────────────────────────────┐
                                                      │
Phase 1 (Schema) ─────────────────────┐              │
                                       │              │
Phase 2 (Business Logic) ─────────────┤              │
  2.1 Nonce (depends on schema)       │              │
  2.2 Offline removal (depends on 1F) │              │
  2.3 Task cancel (depends on 1D)     │              │
  2.4 Audit log (independent)         │              │
  2.5 Error format (independent)      │              │
                                       │              │
Phase 3 (Architecture) ───────────────┤              │
  3.1 Module imports (independent)     │              │
  3.2 Warning SLA (depends on 1C)     │              │
  3.3 Severity escalation (independent)│             │
  3.4 Payroll notification (independent)│             │
  3.5 DomainEvent companyId (depends on 1A)│         │
                                       │              │
Phase 4 (Frontend) ───────────────────┤              │
  4.1 EOD photos (depends on 1E)      │              │
  4.2 CANCELLED status (depends on 1D)│              │
  4.3 Nonce flow (depends on 2.1)     │              │
  4.4 Offline removal (depends on 2.2)│              │
  4.5 Error format (depends on 2.5)   │              │
                                       │              │
Phase 5 (Verify) ─────────────────────┘              │
                                                      │
All phases must pass before deployment ◄──────────────┘
```

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Schema migration breaks existing data | Backfill scripts run in transaction. Test on dev DB first. |
| Nonce mandatory breaks mobile/PWA | Frontend nonce-fetch flow must be implemented BEFORE making backend mandatory. Deploy Phase 4.3 alongside 2.1. |
| Removing PortalsModule breaks complaints | Verify no other module depends on portals endpoints. CR: complaints are handled by CRM module, not portals. |
| Cross-module import removal breaks DI | Verify each module's `.module.ts` already imports `ApprovalsModule`. Remove imports only if DI resolves correctly. |
| Audit log transactional change is too complex | Deploy Option B (await instead of fire-and-forget) as quick fix. Full transactional audit in next sprint. |

---

## What This Plan Does NOT Fix (Deferred to Next Sprint)

These are acknowledged but deferred as they are lower priority or require more architectural discussion:

| Item | Reason Deferred |
|---|---|
| MINOR-01 (class-validator vs Zod) | Functional equivalence. Large refactor with no security impact. |
| MINOR-09 (Module README.md files) | Documentation only. |
| MINOR-12 (Rate limit 100/min too restrictive) | Needs load testing data to tune. |
| MINOR-14 (Log files in repo) | Covered by .gitignore. Clean up on next commit. |
| MINOR-18 (PWA offline queue) | Intentional design decision — attendance is online-only per SRS. |
| MAJOR-07 (Test coverage threshold) | Needs systematic test writing sprint. |
| MAJOR-09 (Repository layer) | Architectural refactor — too large for tonight. |
| EXTRA-07 (Password complexity) | Needs UX decision on requirements. |
| CQRS read models for dashboard | Performance optimization, not a defect. |
| Correlation ID propagation | Observability enhancement, not a defect. |

---

## Commit Strategy

Each phase should be committed separately for clean rollback:

```
commit 1: "fix(security): remove .env from tracking, add temp_*.sql to gitignore, remove PortalsModule"
commit 2: "fix(schema): add companyId to isolated tables, remove deletedAt from append-only tables, add WarningAcknowledgement"
commit 3: "fix(schema): add CANCELLED to TaskStatus, add photoUrls to EodReport"
commit 4: "fix(attendance): make nonce mandatory, remove offline sync"
commit 5: "fix(tasks): use CANCELLED status instead of soft delete for task cancellation"
commit 6: "fix(audit): make audit log write awaited instead of fire-and-forget"
commit 7: "fix(api): standardize error response format per EC §12"
commit 8: "fix(modules): remove cross-module file-path imports, fix DI resolution"
commit 9: "feat(warnings): add acknowledgement SLA timeout worker"
commit 10: "fix(warnings): escalate warning severity with escalation stage"
commit 11: "fix(payroll): add Owner/HR notification on hold during payroll run"
commit 12: "feat(eod): add photo upload support to EOD reports"
commit 13: "fix(frontend): add CANCELLED status handling, nonce flow, error format"
```

---

## Final Checklist Before Deployment

- [ ] `.env` files not tracked in git
- [ ] `temp_*.sql` files not tracked in git
- [ ] `PortalsModule` removed from app.module.ts
- [ ] Migration applies cleanly on fresh DB
- [ ] Migration applies cleanly on existing DB (with backfill)
- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] Attendance nonce is mandatory (test: submit without nonce → 400)
- [ ] Attendance offline sync removed (test: no `clientGeneratedUuid` in API)
- [ ] Task cancel sets `CANCELLED` status (test: cancel task → status=CANCELLED)
- [ ] Escalation worker skips CANCELLED tasks
- [ ] Audit log writes are awaited (test: check logs for audit failures)
- [ ] Error responses include `success: false` field
- [ ] Cross-module imports removed (test: `grep -r "from '../approvals/" modules/` returns empty)
- [ ] WarningAcknowledgement table exists (test: acknowledge warning → record created)
- [ ] Warning SLA worker runs (test: leave warning unacknowledged past SLA → Owner notified)
- [ ] EOD reports support photo upload (test: submit EOD with photos → saved)
- [ ] Payroll hold notifies Owner/HR (test: run payroll with held employee → notification)
- [ ] No sensitive data in logs (test: submit login with password → password redacted in api.log)
- [ ] All existing tests pass
- [ ] Frontend builds without errors
- [ ] API builds without errors

---

*This plan is designed to be executed sequentially. Each phase builds on the previous. Do not skip phases. If a task is blocked, note it and continue with independent tasks within the same phase.*

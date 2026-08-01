# FIX_SUMMARY — Phase 2 Diagnostic & Fix Session

**Spec:** `ASHA_BUILDERS_ERP_MASTER_SRS (1).md` (v5)
**Branch:** `codex/production-docker-stabilization`
**Date:** 2026-08-01
**Companion docs:** `DELIVERY_AUDIT.md` (audit), `PROPOSAL_ACCOUNTS_DOUBLE_ENTRY.md` (B4 proposal)

---

## Status at a glance

| Item | § | Verdict | Commit | Live-verified |
|---|---|---|---|---|
| B1 attendance nonce JSON bug | §5.1 | ✅ Fixed | `114a976` | yes |
| B2 payroll counts non-VERIFIED attendance | §5.7 | ✅ Fixed | `7c1ebf5` | yes |
| B3 two-tier task completion sign-off | §7.10 | ✅ Fixed | `8bb84c6` | yes |
| B4 accounts double-entry spine | §5.17/§5.19/§5.20 | 📋 Proposal | `571447a` | n/a (awaiting approval) |
| B5 notification coverage | §15.1/§5.30 | ✅ Fixed | `142b54b` | yes |
| B6 secure-context on LAN IP | guidance | 🧭 Guidance only | n/a | n/a |

Test suite: **75 suites / 458 tests passing** (API). API `tsc` clean; web build passes.
Migrations applied: 38.

---

## B1 — Attendance nonce JSON bug (commit `114a976`)

**Finding:** `GET /attendance/nonce/generate` returned a bare 32-char hex string served as
`text/html` instead of `{ nonce }` JSON, breaking Check In/Out entirely (client does
`response.json()` unguarded).

**Fix:** wrapped the nonce in a JSON envelope. Live-reproduced a successful Check In after
the fix.

---

## B2 — Payroll counts non-VERIFIED attendance (commit `7c1ebf5`)

**Finding:** `DayAggregateStatus` only had `COMPLETED`/`UNDER_REVIEW`; evidence review
approval wrote `APPROVED` (not `VERIFIED`), so PENDING/FLAGGED/UNDER_REVIEW days leaked
into payroll snapshots.

**Fix:**
- Added `VERIFIED` and `FLAGGED` to `DayAggregateStatus` (schema) + migration (37→38).
- Evidence review: APPROVED → `VERIFIED`; FLAGGED → `FLAGGED`.
- Finalization: only `VERIFIED`/`COMPLETED` (or Owner-override) days enter payroll.
- Updated finalization + compliance specs. Live-verified snapshot showed only
  `VERIFIED` days (`paidDays: 1, payableMinutes: 465`).

---

## B3 — Two-tier task completion sign-off (commit `8bb84c6`)

**Finding:** §7.10 requires manager **acknowledge** → Owner **approve** before a task
leaves the needs-attention state. v1 only had an assignee ack that flipped to
`IN_PROGRESS`; no `task_completion_approvals` model existed.

**Fix:**
- New `TaskCompletionApprovalStatus` enum (`PENDING | MANAGER_ACKNOWLEDGED | APPROVED |
  REJECTED`) + `TaskCompletionApproval` model (unique per task) + migration.
- New permissions `task:completion:acknowledge` / `task:completion:approve` + role matrix
  (acknowledge: OWNER/ADMIN/MANAGER/TEAM_LEAD/HR_MANAGER; approve: OWNER/ADMIN).
- New events `TASK_COMPLETION_ACKNOWLEDGED` / `TASK_COMPLETION_APPROVED`.
- `task-proof.service.ts`: `submitProof` upserts a PENDING approval row; new
  `acknowledgeCompletion` (tier 1) and `approveCompletion` (tier 2, hard-gated on
  MANAGER_ACKNOWLEDGED) + `rejectCompletion`.
- Controller: `POST tasks/proofs/:proofId/acknowledge|approve|reject`; old single-tier
  `review/:action` removed (404s live).
- Notification listener: on acknowledge, every OWNER user gets the distinct **"Approve
  completion"** action (§5.30).
- Frontend: two-tier buttons in task detail + task-reviews queue.
- Spec: 5 new task-proof tests. **Live-verified:** approve-before-ack → HTTP 400 (gate);
  manager ack → `MANAGER_ACKNOWLEDGED`; owner approve → task `COMPLETED`, proof +
  approval `APPROVED`; both "Approve completion" and "Task completed" notifications
  delivered to Owner.

---

## B4 — Accounts double-entry spine (proposal `571447a`)

**Finding (audit delegation `curious-jade-lynx`):** ~40% of §5.17/§5.19/§5.20. Client
EMI/collection tracker works, but **no journal entries, ledger, trial balance, cost
centers, bank reconciliation, GST, vendor payments, or owner expenses**. Every financial
record is a free-floating single-sided row.

**Deliverable:** `PROPOSAL_ACCOUNTS_DOUBLE_ENTRY.md` — full schema (`journal_entries`,
`journal_entry_lines`, `bank_reconciliation_lines`), posting engine design (balanced
debit=credit in the caller's transaction, outbox-published), wiring of client payments /
expense claims / payroll payout / owner expenses to the ledger, §5.19 tracker fixes
(schedule↔entry linkage, server-side outstanding, OVERDUE job), cost centers →
journal-derived §5.20 profitability, manual reconciliation, vendor payments, permissions,
migration/rollout, tests, and open questions. **No code changed — awaiting approval.**

---

## B5 — Notification coverage (commit `142b54b`)

**Finding:** only 4 events handled by `governance-notification.listener.ts`; several
published domain events reached no user. §5.30: *"The Owner must never have to go looking
for a change — every module writes to this feed."*

**Fix (coverage map):**
- Leave, lead-assign/convert, site-visit-scheduled, booking-confirmed, employee-invite,
  warning-created, task-overdue/escalation, evidence-review were **already covered** by
  other listeners (`NotificationListener`, `NotificationRouter`, task/evidence/warning
  listeners) — confirmed, not duplicated.
- Added **owner feed** handlers (idempotent via `GovernanceEventProcessor`) for the
  genuinely unrouted events: `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`,
  `LEAD_STATUS_CHANGED`, `SITE_VISIT_COMPLETED`, `BOOKING_CREATED`, `PROPERTY_CREATED`,
  `PROPERTY_STATUS_CHANGED`, `PAYROLL_PROCESSED`, `ATTENDANCE_FINALIZED`.
- Shared `notifyOwners` helper skips the acting user (no self-notification noise);
  `DOCUMENT_ACCESSED` intentionally excluded (read event, would spam the feed).
- 7 new listener tests (14 total in the spec). **Live-verified:** uploaded a document as
  Owner; a second Owner user received "Document uploaded" (SYSTEM, correct link) while the
  acting Owner was skipped.

---

## What remains

1. **B4 build** (after proposal approval): P1 spine → P2 wiring → P3 cost
   centers/reconciliation/vendor payments → UI, per proposal §12.
2. **B6**: serve over HTTPS (or accept localhost-only for LAN testing) — guidance, not code.
3. Non-blocking open items from `DELIVERY_AUDIT.md` §"Non-blocking but noted" (geofence
   CRUD controller, evidence-retention 90d, settings-change audit event, etc.).

---

## Verification record

- `apps/api`: `npx jest` → 75 suites / 458 tests pass; `npx tsc --noEmit` clean.
- `apps/web`: `npm run build` passes (only pre-existing untracked e2e spec TS noise).
- Live: API healthy (`/api/health` ok, DB+Redis ok); migrations applied (38); each fix
  live-reproduced and test data cleaned up after verification.

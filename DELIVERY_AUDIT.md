# Delivery Audit — ASHA Builders ERP

**Reference spec:** `ASHA_BUILDERS_ERP_MASTER_SRS (1).md` (v5)
**Date:** 2026-08-01
**Method:** Static code audit (API controllers/services, Prisma schema, web hooks, listeners) + live API repro. Companion to Phase 0 root-cause report and the stale `SRS_COMPLIANCE_AUDIT.md` (July 16, spec v1 era — superseded here).

---

## Summary

| Area | Verdict | Compliance (est.) |
|---|---|---|
| Attendance core (punch, geofence, selfie, sessions) | **Pass with known bug** | ~90% |
| Evidence review workflow | **Partial** | ~75% |
| Payroll / attendance-driven computation | **Gap** | ~60% |
| Tasks (SLA, escalation, proof) | **Gap** | ~70% |
| Warnings / disciplinary | **Partial** | ~70% |
| Approvals engine | **Pass** | ~85% |
| Payroll holds | **Pass** | ~85% |
| Notifications coverage (§15.1) | **Partial** | ~65% |
| Settings / Security Center (§5.29) | **Partial** | ~70% |
| Accounts & Ledger (§5.17) | **Critical gap** | ~40% |
| Reports / exports (§15.1) | **Pass** | ~90% |
| 2FA / auth (§3.1) | **Pass** | ~90% |
| Company scoping / deletion / access logging | **Pass** | ~90% |
| **Overall** | **Blocked-delivery items exist** | **~70%** |

**Critical blocking finding:** the attendance nonce endpoint returns a bare hex string instead of JSON, breaking the Check In / Check Out flow entirely (see Phase 0 report). This alone blocks core delivery on the attendance page.

> **Post-audit status (2026-08-01, Phase 2 fix session):** B1, B2, B3, B5 are **fixed, deployed, tested, live-verified, and committed** on `codex/production-docker-stabilization`. B4 has a **proposal** awaiting approval (`PROPOSAL_ACCOUNTS_DOUBLE_ENTRY.md`). B6 (secure-context on LAN IP) is a guidance/HTTPS item, not a code fix. See §"Compliance gate status" and `FIX_SUMMARY.md`.

---

## Phase 0 recap (root causes, reported)

1. **LAN/IP access = non-secure context.** `http://192.168.1.5:3000` blocks `navigator.mediaDevices` (camera selfie) and Geolocation (`Only secure origins are allowed`). Works on `http://localhost:3000`. Guidance: use localhost for LAN tests, or HTTPS.
2. **JSON parse error (Check In/Out broken everywhere).** `GET /api/v1/attendance/nonce/generate` returns a **bare 32-char hex string** (`attendance.service.ts:77`), served as `text/html`, while the client does `api.get<{nonce:string}>("/attendance/nonce/generate")` + unguarded `response.json()` (`lib/api.ts:70`). Live-reproduced (owner, via proxy): `200`, body `6d8d9ab7…`, `JSON.parse` FAIL. User's `Unexpected token 'e', "e8882d43ff…"` = same bug (nonce starting with `e`).

---

## Verified findings by module

### 1. Attendance core (§5.1–§5.3)
- `GET /attendance/nonce/generate` → `attendance.controller.ts:96` returns raw `crypto.randomBytes(16).toString('hex')` (bare string). **BUG** — must wrap `{ nonce }`.
- Geofence validation present (`attendance.service.ts:134-214`): office IP + GPS radius against `GeofenceVersion` rows; 403 on mismatch.
- Mandatory selfie capture enforced (line 217).
- Atomic write transaction for punch + evidence + session + domain event (line 241+).
- Sessions: open/close present; `ATTENDANCE_SESSION_CLOSED` event emitted.
- **Half-day cutoff** config existence not yet verified (settings JSON has no explicit half-day cutoff key).

### 2. Evidence review workflow (§5.3.3–§5.3.4)
- `AttendanceEvidence` (schema:217-242) stores image, GPS, address, device; `AttendanceEvidenceReview` (244-261) with `status`, `reviewedById`, `flaggedReason`.
- Review listener (`attendance-evidence-review.listener.ts`): APPROVED → VERIFIED; FLAGGED → FLAGGED; REJECTED → REJECTED with notifications.
- **Gaps:**
  - `DayAggregateStatus` enum (`schema:2794`) only has `COMPLETED` / `UNDER_REVIEW` — **no `VERIFIED` / `FLAGGED` states** for day aggregates.
  - Review row has `updatedAt` and controller imports `Patch`/`Delete` — **immutability of approved reviews not guaranteed** (SRS requires one-time decision, no edit/delete after).
  - "View Doc" modal (selfie + GPS + address + flag action) not yet confirmed in web UI.
  - Reject → employee warning escalation not confirmed.

### 3. Payroll (§5.7, §7.x) — **GAP**
- `attendance-finalization.service.ts` maps **ALL** day aggregates to finalized entries regardless of evidence status.
- `payroll-attendance-snapshot.projector.ts` consumes finalized `payableMinutes` **without filtering evidence status**.
- **Result:** PENDING / FLAGGED / UNDER_REVIEW attendance counts toward payroll. SRS §5.7 requires **only VERIFIED (or Owner-overridden) days** count.
- Payroll-holds module (activate/release/escalate) present and evented.
- Payslips, incentives, journal entry posting, leave 3-day rule — **not yet audited** (coverage pending).

### 4. Tasks (§7.1–§7.10) — **GAP**
- `Task` model (schema:2088-2115) has `acknowledgedAt`, `escalationLevel`, `slaDeadline`, `reminderSentAt`, proof fields.
- SLA: overdue + breach reminders present (`task.sla.reminder`, `task.sla.breached`).
- Escalation: manager → HR chain present; `task-escalation-notification.listener.ts` exists.
- Proof: TASK_PROOF_REJECTED / TASK_PROOF_ESCALATED_HR events exist.
- **Missing:** §7.10 **two-tier completion sign-off** — no `task_completion_approvals` model; `acknowledgeTask` (`tasks.service.ts:199`) is assignee-only ack → `IN_PROGRESS`; there is **no distinct manager-acknowledge → owner-approve completion gate**.

### 5. Warnings / disciplinary (§5.8) — Partial
- Warning engine + approval listener + threshold breach + expiry events present.
- Acknowledge path present. Deep coverage pending.

### 6. Approvals engine (§5.5) — Pass
- Created / approved / rejected / escalated / overridden events all defined; governance-notification listener handles APPROVED/REJECTED.
- ~85% (deep audit pending on escalation rule chain).

### 7. Payroll holds (§5.7.5) — Pass
- Activate / release-request / release / reject / escalate / owner-emergency-hold events all present with dedicated listeners.
- ~85%.

### 8. Notifications coverage (§15.1) — **Partial**
- Event bus well-instrumented (71 domain event types).
- **Only 4 events** handled by `governance-notification.listener.ts` (TASK_COMPLETED, APPROVAL_APPROVED, APPROVAL_REJECTED, PAYROLL_HOLD_RELEASE_REQUESTED). Other listeners cover task escalation, evidence review, payroll holds, warnings.
- **Not covered by notification listeners:** LEAVE_REQUESTED/APPROVED/REJECTED, ANNOUNCEMENT_*, DOCUMENT_*, LEAD_STATUS_CHANGED, SITE_VISIT_*, BOOKING_*, PROPERTY_*, PAYROLL_PROCESSED, ATTENDANCE_FINALIZED, WARNING_CREATED/ACKNOWLEDGED (some may route via other listeners or direct `notificationsService.create`; **module-by-module coverage map still pending**).
- `notificationsService.create` referenced directly in `communication`, `hrms`, `scheduler`, `notifications` + 23 in governance-events — coverage is partial, needs a full map vs. §5.30 required routes.

### 9. Settings / Security Center (§5.29) — Partial
- `SystemSettings` JSON blob on Company: `debugLogging`, `sessionTimeoutMinutes`, `passwordMinLength`, `passwordRequireSpecialChar`, `maxLoginAttempts`. Update + get endpoints (companies.controller:38-52). **No audit event on settings change** verified yet.
- Owner self-service password change: present, requires current password + TOTP re-challenge when 2FA on + last-5 password reuse guard + revoke all tokens (`auth.service.ts:365-449`). **Pass.**
- 2FA: TOTP setup/verify/disable/backup-codes + temp-token challenge + required for Owner/Admin at password change. **Pass.**
- `security-events` module + web `dashboard/security/page.tsx` present.
- Geofence config CRUD: `GeofenceVersion` model exists but **CRUD controller/service not located** — pending.
- Half-day cutoff, evidence retention 90d, notification routing prefs: **pending**.

### 10. Accounts & Ledger (§5.17) — **CRITICAL GAP**
- `ChartOfAccount` model exists (schema:1355-1374) with parent/child structure.
- PaymentEntry, PaymentSchedule, ExpenseClaim, ProjectCostEntry exist (client EMI/collection tracker, expense claims, manual project cost).
- **MISSING entirely:** `journal_entries`, `journal_entry_lines`, `cost_centers`, general/party ledgers, trial balance, bank reconciliation, GST field.
- Every financial record is **single-sided and free-floating** — **no double-entry journal, no posting to COA, no ledger, no trial balance.**
- **§5.17 CRITICAL double-entry rule violated.** ~40% compliance.
- (Details in deep-dive: curious-jade-lynx.)

### 11. Reports / exports (§15.1) — Pass
- Export orchestration logs `logExport` (with sensitive flag for payroll/commissions/employees) + `logDownload` per file in a transaction (export-orchestration.service.ts:83-101).
- Export list + history role-gated (OWNER/ADMIN/HR_MANAGER/ACCOUNTS).
- Quotation download: permission-gated (`Permissions.QUOTATION_DOWNLOAD`), access-logged (`QuotationAction.DOWNLOAD`), watermarked PDF with downloaded-by + timestamp.
- ~90%.

### 12. Auth / 2FA (§3.1) — Pass
- TOTP setup/verify/disable/backup-codes; temp-token challenge; re-challenge on password change; password history (last 5); token revocation; security audit events (`security.password.change`, `.failure`).
- ~90%.

### 13. Company scoping / deletion / access logging (§15.1) — Pass
- Every service references `companyId` except pure helpers (`payroll-evaluation.service.ts`, `quotation-pdf.service.ts` — called with scoped context).
- `DeletionLogService` + `deletionLog` table exist, but only referenced inside `audit` module — **call-site coverage across soft-deletes pending** (may not be wired into all delete paths).
- Activity-logs module present.

---

## Compliance gate status

### Blocks-delivery (must fix before go-live)
- [x] **B1 — Attendance nonce JSON bug** (check-in/out fully broken). Verified live. Fixed + committed (`114a976`).
- [x] **B2 — Payroll counts non-VERIFIED attendance** (§5.7). PENDING/FLAGGED/UNDER_REVIEW days leak into payroll snapshot. Fixed + committed (`7c1ebf5`).
- [x] **B3 — No two-tier task completion sign-off** (§7.10). Assignee ack only. Fixed + committed (`8bb84c6`).
- [ ] **B4 — Accounts: no double-entry / journal / ledger / trial balance** (§5.17). CRITICAL. **Proposal ready** (`PROPOSAL_ACCOUNTS_DOUBLE_ENTRY.md`, committed `571447a`) — awaiting approval before build.
- [x] **B5 — Notification coverage incomplete** (§15.1/§5.30): several events not routed to users. Owner feed routing added + committed (`142b54b`).
- [ ] **B6 — Secure-context camera/GPS on LAN IP** (guidance/HTTPS only; blocks field app on phone via IP). Guidance item — no code fix; use localhost or HTTPS.

### Non-blocking but noted
- Review-row immutability not guaranteed (updatedAt + PATCH/DELETE imports).
- DeletionLog call-site coverage unverified.
- Half-day cutoff / evidence retention 90d / settings-change audit event pending.
- Geofence CRUD controller/service pending.
- Web "View Doc" evidence modal pending.

---

## Known open audit items (pending deep-dive)
- Leave module (§5.6: 3-day rule, encashment).
- Incentives / commission / bonus computation.
- Payroll payslip + journal entry posting + disbursement approval chain.
- Meetings / training / recruitment / assets / inventory / EOD / project profitability / agreements / permissions-grants modules vs. spec.
- Web UI parity for: evidence review modal, security center, geofence admin, payroll holds UI, warning acknowledge.
- Module-by-module notification route map (§5.30).
- Settings-change audit event.

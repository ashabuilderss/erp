# Proposal — Accounts Double-Entry Spine (SRS §5.17, §5.19, §5.20)

**Status:** PROPOSAL — awaiting approval before implementation
**Tracker:** DELIVERY_AUDIT.md B4 (block-delivery, CRITICAL)
**Audit basis:** `delegation_read("curious-jade-lynx")` accounts/ledger audit (2026-08-01)

---

## 1. Problem

SRS §5.17's **Critical rule**: *"Every financial transaction — client payment, vendor
payment, expense, salary payout — creates a journal entry. Nothing is accounts-side
'just a note.' This is what makes a trial balance possible."*

Today the ERP is a **collections tracker, not an accounting system**. Every financial
record is a free-floating single-sided row that never posts to any ledger:

| Requirement (§5.17) | Current state | Evidence |
|---|---|---|
| Chart of Accounts (tree) | ✅ CRUD + parent/child | `chart-of-accounts.service.ts:11-90` |
| **Journal entries** | ❌ absent | no model, no `debit`/`credit` columns anywhere |
| **Journal entry lines** | ❌ absent | balanced debit=credit unenforceable |
| **Ledger views (GL + party-wise)** | ❌ absent | `ledger`/`trial.?balance` grep = 0 in api+web |
| **Trial balance** | ❌ absent | no endpoint/computation |
| **Site/Project cost centers** | ❌ absent | no `siteId` on any financial record |
| **Bank reconciliation (manual)** | ❌ absent | `reconcil` grep = 0 |
| **GST/tax field** | ❌ absent | only `Company.gstin` / `Vendor.gstin` |
| **Vendor/contractor payments** | ❌ absent | vendor is CRUD-only (`construction.controller.ts:130-179`) |
| **Owner expenses** | ❌ absent | no model/endpoint/UI |
| Client EMI schedule + collections | ✅ working | `PaymentSchedule`/`PaymentEntry` (but unlinked) |
| Project profitability | ⚠️ manual tracker | `project-profitability.service.ts` sums cost entries; not journal-derived |

**Bottom line:** ~40% of §5.17/§5.19/§5.20 intent. Client collections exist; the
double-entry core, ledger, trial balance, cost centers, reconciliation, GST, vendor
payments, and owner expenses do not.

---

## 2. Scope Decision (this proposal)

This is a **structural build**, not a refactor. Three sub-parts, in dependency order:

1. **P1 — Ledger spine (schema + core service).** New tables, balanced-entry posting
   engine, general + party-wise ledger queries, trial balance. *Prerequisite for P2/P3.*
2. **P2 — Wire existing flows to the spine.** Client payments, expense claims, payroll
   payout, and (new) owner expenses each post a balanced journal entry in the same
   transaction as the business record. §5.19 collection tracker gains server-side
   outstanding + schedule↔entry linking.
3. **P3 — Cost centers + bank reconciliation + vendor payments.** Site-tagged entries,
   manual bank reconciliation, contractor/vendor payment schedules. Also make §5.20
   profitability journal-derived.

**Out of scope (unchanged):** no payment gateway, no bank API, no automated
reconciliation feed, no automated GST filing — per §5.17 "fully manual."

---

## 3. Schema Proposal (P1)

All additive. `Decimal(18,2)` for money (existing booking/payment uses Decimal; fixes
`Float` in ProjectBudget/ProjectCostEntry).

```prisma
model JournalEntry {
  id           String   @id @default(cuid())
  companyId    String
  entryNumber  Int      @default(autoincrement())
  entryDate    DateTime
  referenceType String  // PAYMENT, EXPENSE, PAYROLL, OWNER_EXPENSE, JOURNAL, ...
  referenceId  String   // business record id (paymentEntryId, expenseClaimId, ...)
  description  String?
  status       JournalEntryStatus @default(POSTED) // POSTED / RECONCILED
  gst          Decimal? @db.Decimal(18,2)          // tax/GST field (§5.17)
  siteId       String?                              // cost center tag (§5.17/§5.20)
  createdById  String?
  lines        JournalEntryLine[]
  reconciled   BankReconciliationLine?

  company Company @relation(...)
  site    ConstructionSite? @relation(...)
  @@unique([companyId, entryNumber])
  @@index([companyId, entryDate])
  @@index([companyId, referenceType, referenceId])
  @@map("journal_entries")
}

model JournalEntryLine {
  id           String  @id @default(cuid())
  journalEntryId String
  accountId    String                       // -> ChartOfAccount
  debit        Decimal @default(0) @db.Decimal(18,2)
  credit       Decimal @default(0) @db.Decimal(18,2)
  partyId      String?                      // client/vendor/contractor for party ledger
  partyType    String?                      // CLIENT / VENDOR / CONTRACTOR / EMPLOYEE

  journalEntry JournalEntry @relation(...)
  account      ChartOfAccount @relation(...)
  @@index([accountId])
  @@index([partyId, partyType])
  @@map("journal_entry_lines")
}

model BankReconciliationLine {
  id             String @id @default(cuid())
  journalEntryId String @unique
  bankStatementRef String
  reconciledDate   DateTime
  reconciledById   String
  journalEntry JournalEntry @relation(...)
  @@map("bank_reconciliation_lines")
}
```

Constraints enforced in the **posting service** (not the DB):
- Every `JournalEntry` has ≥ 2 lines with `SUM(debit) === SUM(credit)`.
- A line carries exactly one of `debit`/`credit` non-zero.
- `siteId` on the entry tags all its lines to one cost center.
- Ledger queries are **computed from lines** (ADR-07 replay philosophy), never stored
  redundantly.

### COA amendments
- `ChartOfAccount` + `gst`-related account type unchanged; add a `isRoot` validation
  rule and a **construction-default seed** (Site Materials, Labour Payments, Vendor
  Payables, Client Receivables, Office Expenses) — currently absent.
- `ProjectBudget.amount` / `ProjectCostEntry.amount`: `Float` → `Decimal(18,2)`.

---

## 4. Posting Engine (P1) — `modules/accounts`

New module `accounts` (or extend existing `modules/accounts`), exposing:

```
JournalService
  post(tx, { companyId, entryDate, referenceType, referenceId,
             description, lines[], gst?, siteId?, createdById? })
    - validates debit==credit, one-side-only lines, account belongs to company
    - creates JournalEntry + lines in the same tx as the caller's business write
  balance(tx, { companyId, entryDate? }) -> trial balance rows (accountId, sum(debit), sum(credit))
  generalLedger({ companyId, from, to, accountId? })
  partyLedger({ companyId, partyType, partyId, from, to })
```

**Critical design rule:** posting happens **inside the caller's transaction** via the
shared `PrismaService.$transaction`. The outbox publish for any accounting domain event
(`JOURNAL_ENTRY_POSTED`, `JOURNAL_ENTRY_RECONCILED`) reuses `GovernanceEventPublisher`
so a crash between business write and ledger post cannot desync them — same pattern as
fix #2/#3.

---

## 5. Wiring Existing Flows (P2)

Each posting is a balanced entry in the same transaction:

| Flow | Posting (debit → credit) | Call site |
|---|---|---|
| Client payment recorded (`PaymentEntry`) | Bank/Cash → Client Receivables | `payment-entries.service.ts:62-91` |
| Schedule marked PAID (now also creates a `PaymentEntry` — fixes §5.19 linkage gap) | Bank/Cash → Client Receivables | `payment-schedules.service.ts:63-79` |
| Expense claim approved | Expense account → Vendor/Employee payables | `expense-claims.service.ts:55-83` |
| Payroll payout (`markPaid`) | Salary expense (+ TDS liability) → Bank | `payroll.service.ts:361-422` |
| **Owner expense (new)** | Expense account → Bank/Cash | new `owner-expenses` module + UI |

Client payment / expense / payroll all pass `referenceType`+`referenceId` so the
journal entry traces to the business record and vice-versa.

### §5.19 tracker fixes (bundled in P2)
- `PaymentSchedule` PAID → auto-creates `PaymentEntry` (single "paid" truth).
- Server-side `outstanding` computation (today it is client-only in
  `payments/page.tsx:44-45,102-104`).
- Scheduler job to flip `ScheduleStatus.OVERDUE` (enum exists but is never set).
- UI: mark-installment-paid, edit/delete for schedules and entries
  (`usePayments.ts:40-82`).

---

## 6. Cost Centers, Reconciliation, Vendor Payments, Profitability (P3)

1. **Site cost centers:** `siteId` on `JournalEntry` (schema above); `ConstructionSite`
   unchanged. §5.20 `ProjectProfitabilityService` switches from summing
   `ProjectCostEntry` to aggregating site-tagged journal lines (income vs expense).
2. **Bank reconciliation (manual):** `POST /accounts/reconciliation` marks a
   `JournalEntry` reconciled against a manually entered bank statement ref;
   `BankReconciliationLine` + `status=RECONCILED`; UI page.
3. **Vendor/contractor payments:** `PaymentSchedule`+`PaymentEntry` are booking-scoped;
   add vendor-payment module mirroring the client tracker (`VendorPayment` /
   `VendorPaymentSchedule` posting to Vendor Payables), wired under the existing
   `construction` vendor CRUD.
4. **GST field** on `JournalEntry` for statutory reporting (no automated filing).

---

## 7. Web UI (P3)

New pages under `/dashboard/accounts/*`:
- `ledger` (general + party-wise filters)
- `trial-balance` (with date range)
- `reconciliation`
- `owner-expenses` (submit/list/approve)
- `vendor-payments` (schedules + record payment)

Existing pages stay; `payments`/`expenses`/`profitability` gain server-side
outstanding and journal links.

---

## 8. Permissions & Roles

New permission constants in `permissions.ts`, following existing `ACCOUNT_*` grants:
- `ACCOUNT_JOURNAL_CREATE/READ` — ACCOUNTS, OWNER
- `ACCOUNT_RECONCILE` — ACCOUNTS, OWNER
- `OWNER_EXPENSE_CREATE` — OWNER (owner expenses are owner-only by nature)
- `VENDOR_PAYMENT_CREATE/READ` — ACCOUNTS, OWNER

---

## 9. Migration & Rollout

- Additive Prisma migration `add_accounts_double_entry_spine` (tables + indexes).
- COA construction-default seed migration.
- **No destructive change** to existing tables; `PaymentEntry`/`ExpenseClaim`/payslips
  gain **no** new columns in P1 (reference links live on the new journal tables).
- Existing historical rows are **not** back-posted in this proposal (would require a
  deterministic opening-balance migration — flagged as a follow-up decision). New
  transactions after deployment post to the ledger.

---

## 10. Testing

- `journal.service.spec.ts`: balanced/unbalanced entries, one-side-line validation,
  party ledger grouping, trial balance totals, idempotent outbox publish.
- Integration specs: `payment-entries`/`expense-claims`/`payroll` post entries in-tx;
  `payment-schedules` PAID creates both entry and collection record.
- Web: page smoke via existing e2e harness (Phase 2 pattern).

---

## 11. Open Questions (need Owner/decision before build)

1. **Back-post history?** Post opening balances for existing bookings/payments, or
   start clean at go-live? (Recommend: start clean; opening-balance journal for
   current receivables.)
2. **Owner expenses UX:** self-service expense entry by Owner, or also an Accounts
   user on behalf of Owner?
3. **Vendor payments scope:** is `construction` module's vendor list the party source
   for the vendor ledger, or a separate Accounts vendor registry?
4. **COA depth/type rules:** fixed max depth (e.g., 4) and parent-type consistency?

---

## 12. Recommended Implementation Order

1. P1 schema + posting engine + ledger/trial-balance endpoints + tests
2. P2 wiring (payments, expense, payroll, owner expenses) + §5.19 tracker fixes
3. P3 cost centers → profitability, reconciliation, vendor payments, UI
4. Seed, permissions, docs, live verify (Phase 2 pattern), commit per phase

*This proposal does not modify code. It exists for review/approval before B4 work
begins (per ENGINEERING_CONSTITUTION §1/§16).*

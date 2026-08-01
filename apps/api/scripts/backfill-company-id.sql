-- Phase 5: Backfill companyId on 12 models
-- All column names are camelCase (Prisma convention)
-- Run via: docker exec -i dashboard-db psql -U postgres -d realestate_crm < scripts/backfill-company-id.sql

BEGIN;

-- 1. ProjectCostEntry ← ProjectBudget."companyId"
UPDATE project_cost_entries pce
SET "companyId" = pb."companyId"
FROM project_budgets pb
WHERE pce."budgetId" = pb.id AND pce."companyId" IS NULL;

-- 2. Candidate ← JobPosting."companyId"
UPDATE candidates c
SET "companyId" = jp."companyId"
FROM job_postings jp
WHERE c."jobPostingId" = jp.id AND c."companyId" IS NULL;

-- 3. Interview ← Candidate → JobPosting."companyId"
UPDATE interviews i
SET "companyId" = jp."companyId"
FROM candidates c
JOIN job_postings jp ON c."jobPostingId" = jp.id
WHERE i."candidateId" = c.id AND i."companyId" IS NULL;

-- 4. SopAcknowledgement ← SopDocument."companyId"
UPDATE sop_acknowledgements sa
SET "companyId" = sd."companyId"
FROM sop_documents sd
WHERE sa."sopDocumentId" = sd.id AND sa."companyId" IS NULL;

-- 5. TrainingRecord ← Employee."companyId"
UPDATE training_records tr
SET "companyId" = e."companyId"
FROM employees e
WHERE tr."employeeId" = e.id AND tr."companyId" IS NULL;

-- 6. AssetAssignment ← Asset."companyId"
UPDATE asset_assignments aa
SET "companyId" = a."companyId"
FROM assets a
WHERE aa."assetId" = a.id AND aa."companyId" IS NULL;

-- 7. AssetRepair ← Asset."companyId"
UPDATE asset_repairs ar
SET "companyId" = a."companyId"
FROM assets a
WHERE ar."assetId" = a.id AND ar."companyId" IS NULL;

-- 8. MeetingAttendee ← Meeting."companyId"
UPDATE meeting_attendees ma
SET "companyId" = m."companyId"
FROM meetings m
WHERE ma."meetingId" = m.id AND ma."companyId" IS NULL;

-- 9. MeetingMinutes ← Meeting."companyId"
UPDATE meeting_minutes mm
SET "companyId" = m."companyId"
FROM meetings m
WHERE mm."meetingId" = m.id AND mm."companyId" IS NULL;

-- 10. MeetingActionItem ← Meeting."companyId"
UPDATE meeting_action_items mai
SET "companyId" = m."companyId"
FROM meetings m
WHERE mai."meetingId" = m.id AND mai."companyId" IS NULL;

-- 11. PaymentReference ← WorkOrder."companyId"
UPDATE payment_references pr
SET "companyId" = wo."companyId"
FROM work_orders wo
WHERE pr."workOrderId" = wo.id AND pr."companyId" IS NULL;

-- 12. InventorySnapshot ← InventoryItem."companyId"
UPDATE inventory_snapshots isnap
SET "companyId" = ii."companyId"
FROM inventory_items ii
WHERE isnap."itemId" = ii.id AND isnap."companyId" IS NULL;

COMMIT;

-- Verification: these should all return 0
SELECT 'project_cost_entries' AS tbl, COUNT(*) AS null_count FROM project_cost_entries WHERE "companyId" IS NULL
UNION ALL SELECT 'candidates', COUNT(*) FROM candidates WHERE "companyId" IS NULL
UNION ALL SELECT 'interviews', COUNT(*) FROM interviews WHERE "companyId" IS NULL
UNION ALL SELECT 'sop_acknowledgements', COUNT(*) FROM sop_acknowledgements WHERE "companyId" IS NULL
UNION ALL SELECT 'training_records', COUNT(*) FROM training_records WHERE "companyId" IS NULL
UNION ALL SELECT 'asset_assignments', COUNT(*) FROM asset_assignments WHERE "companyId" IS NULL
UNION ALL SELECT 'asset_repairs', COUNT(*) FROM asset_repairs WHERE "companyId" IS NULL
UNION ALL SELECT 'meeting_attendees', COUNT(*) FROM meeting_attendees WHERE "companyId" IS NULL
UNION ALL SELECT 'meeting_minutes', COUNT(*) FROM meeting_minutes WHERE "companyId" IS NULL
UNION ALL SELECT 'meeting_action_items', COUNT(*) FROM meeting_action_items WHERE "companyId" IS NULL
UNION ALL SELECT 'payment_references', COUNT(*) FROM payment_references WHERE "companyId" IS NULL
UNION ALL SELECT 'inventory_snapshots', COUNT(*) FROM inventory_snapshots WHERE "companyId" IS NULL;

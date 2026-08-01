-- Step 3: Make companyId NOT NULL on all 12 tables
-- Run via: docker exec -i dashboard-db psql -U postgres -d realestate_crm < scripts/not-null-company-id.sql
BEGIN;

ALTER TABLE project_cost_entries ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE candidates ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE sop_acknowledgements ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE training_records ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE asset_assignments ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE asset_repairs ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE meeting_attendees ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE meeting_minutes ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE meeting_action_items ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE payment_references ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE inventory_snapshots ALTER COLUMN "companyId" SET NOT NULL;

COMMIT;

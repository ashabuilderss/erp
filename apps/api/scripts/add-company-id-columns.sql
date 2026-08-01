-- Phase 5: Add nullable companyId columns (camelCase, quoted) + indexes
BEGIN;

ALTER TABLE project_cost_entries ADD COLUMN "companyId" TEXT;
ALTER TABLE candidates ADD COLUMN "companyId" TEXT;
ALTER TABLE interviews ADD COLUMN "companyId" TEXT;
ALTER TABLE sop_acknowledgements ADD COLUMN "companyId" TEXT;
ALTER TABLE training_records ADD COLUMN "companyId" TEXT;
ALTER TABLE asset_assignments ADD COLUMN "companyId" TEXT;
ALTER TABLE asset_repairs ADD COLUMN "companyId" TEXT;
ALTER TABLE meeting_attendees ADD COLUMN "companyId" TEXT;
ALTER TABLE meeting_minutes ADD COLUMN "companyId" TEXT;
ALTER TABLE meeting_action_items ADD COLUMN "companyId" TEXT;
ALTER TABLE payment_references ADD COLUMN "companyId" TEXT;
ALTER TABLE inventory_snapshots ADD COLUMN "companyId" TEXT;

CREATE INDEX idx_project_cost_entries_companyId ON project_cost_entries("companyId");
CREATE INDEX idx_candidates_companyId ON candidates("companyId");
CREATE INDEX idx_interviews_companyId ON interviews("companyId");
CREATE INDEX idx_sop_acknowledgements_companyId ON sop_acknowledgements("companyId");
CREATE INDEX idx_training_records_companyId ON training_records("companyId");
CREATE INDEX idx_asset_assignments_companyId ON asset_assignments("companyId");
CREATE INDEX idx_asset_repairs_companyId ON asset_repairs("companyId");
CREATE INDEX idx_meeting_attendees_companyId ON meeting_attendees("companyId");
CREATE INDEX idx_meeting_minutes_companyId ON meeting_minutes("companyId");
CREATE INDEX idx_meeting_action_items_companyId ON meeting_action_items("companyId");
CREATE INDEX idx_payment_references_companyId ON payment_references("companyId");
CREATE INDEX idx_inventory_snapshots_companyId ON inventory_snapshots("companyId");

COMMIT;

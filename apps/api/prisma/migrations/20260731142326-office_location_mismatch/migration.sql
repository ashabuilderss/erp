-- Office geofence mismatch flag for off-site office punches (§5.3.2)
-- Existing rows default to false (no mismatch recorded historically).
ALTER TABLE "attendance_punches" ADD COLUMN "locationMismatch" BOOLEAN NOT NULL DEFAULT false;

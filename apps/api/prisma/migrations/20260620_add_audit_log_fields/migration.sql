-- Add actor, IP, requestId, before/after values to activity_logs for audit reliability
ALTER TABLE "activity_logs"
  ADD COLUMN "actorEmail" TEXT,
  ADD COLUMN "actorName" TEXT,
  ADD COLUMN "actorRole" TEXT,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "beforeValues" JSONB,
  ADD COLUMN "afterValues" JSONB;

-- Index for querying by requestId (traceability)
CREATE INDEX IF NOT EXISTS "activity_logs_request_id_idx" ON "activity_logs" ("requestId");

-- Index for querying by actorEmail
CREATE INDEX IF NOT EXISTS "activity_logs_actor_email_idx" ON "activity_logs" ("actorEmail");

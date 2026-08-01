-- Add columns that exist in schema but were missed by previous migrations

ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lostReason" TEXT;

ALTER TABLE "domain_events" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

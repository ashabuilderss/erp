-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- Create default company and backfill existing data
INSERT INTO "companies" ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
VALUES ('default-company-id', 'Default Company', 'default-company', true, NOW(), NOW());

-- DropIndex
DROP INDEX IF EXISTS "departments_name_key";

-- DropIndex
DROP INDEX IF EXISTS "employees_employeeCode_key";

-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- AlterTable: add companyId as nullable first
ALTER TABLE "users" ADD COLUMN "companyId" TEXT;
ALTER TABLE "departments" ADD COLUMN "companyId" TEXT;
ALTER TABLE "designations" ADD COLUMN "companyId" TEXT;
ALTER TABLE "employees" ADD COLUMN "companyId" TEXT;
ALTER TABLE "attendance" ADD COLUMN "companyId" TEXT;
ALTER TABLE "leave_requests" ADD COLUMN "companyId" TEXT;
ALTER TABLE "properties" ADD COLUMN "companyId" TEXT;
ALTER TABLE "leads" ADD COLUMN "companyId" TEXT;
ALTER TABLE "customers" ADD COLUMN "companyId" TEXT;
ALTER TABLE "site_visits" ADD COLUMN "companyId" TEXT;
ALTER TABLE "bookings" ADD COLUMN "companyId" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "companyId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "companyId" TEXT;
ALTER TABLE "employee_assignments" ADD COLUMN "companyId" TEXT;
ALTER TABLE "performance" ADD COLUMN "companyId" TEXT;

-- Backfill existing rows with default company ID
UPDATE "users" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "departments" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "designations" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "employees" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "attendance" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "leave_requests" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "properties" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "leads" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "customers" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "site_visits" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "bookings" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "activity_logs" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "notifications" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "employee_assignments" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;
UPDATE "performance" SET "companyId" = 'default-company-id' WHERE "companyId" IS NULL;

-- Make companyId NOT NULL
ALTER TABLE "users" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "departments" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "designations" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "employees" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "attendance" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "leave_requests" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "properties" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "leads" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "site_visits" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "activity_logs" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "employee_assignments" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "performance" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_name_key" ON "departments"("companyId", "name");
CREATE UNIQUE INDEX "employees_companyId_employeeCode_key" ON "employees"("companyId", "employeeCode");
CREATE UNIQUE INDEX "users_companyId_email_key" ON "users"("companyId", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "designations" ADD CONSTRAINT "designations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "performance" ADD CONSTRAINT "performance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

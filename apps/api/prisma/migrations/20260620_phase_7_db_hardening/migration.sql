-- DropIndex
DROP INDEX IF EXISTS "activity_logs_actor_email_idx";
DROP INDEX IF EXISTS "activity_logs_request_id_idx";

-- DropIndex (old unique constraints being replaced)
DROP INDEX IF EXISTS "attendance_employeeId_date_key";
DROP INDEX IF EXISTS "designations_name_departmentId_key";
DROP INDEX IF EXISTS "device_registrations_employeeId_deviceId_key";
DROP INDEX IF EXISTS "inventory_items_siteId_materialId_key";
DROP INDEX IF EXISTS "payslips_payrollRunId_employeeId_key";
DROP INDEX IF EXISTS "performance_employeeId_year_quarter_key";
DROP INDEX IF EXISTS "permission_grants_userId_permission_key";
DROP INDEX IF EXISTS "properties_propertyCode_key";

-- AlterTable: PermissionGrant — add companyId step by step
ALTER TABLE "permission_grants" ADD COLUMN "companyId" TEXT;

UPDATE "permission_grants" pg SET "companyId" = u."companyId"
FROM "users" u
WHERE pg."userId" = u."id";

ALTER TABLE "permission_grants" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateTable: ReportExport (from Phase 6)
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filters" JSONB,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ReportExport
CREATE INDEX "report_exports_companyId_idx" ON "report_exports"("companyId");
CREATE INDEX "report_exports_reportKey_idx" ON "report_exports"("reportKey");
CREATE INDEX "report_exports_status_idx" ON "report_exports"("status");
CREATE INDEX "report_exports_createdAt_idx" ON "report_exports"("createdAt");

-- CreateIndex: New company-scoped unique constraints
CREATE UNIQUE INDEX "attendance_companyId_employeeId_date_key" ON "attendance"("companyId", "employeeId", "date");
CREATE UNIQUE INDEX "designations_companyId_name_departmentId_key" ON "designations"("companyId", "name", "departmentId");
CREATE UNIQUE INDEX "device_registrations_companyId_employeeId_deviceId_key" ON "device_registrations"("companyId", "employeeId", "deviceId");
CREATE UNIQUE INDEX "inventory_items_companyId_siteId_materialId_key" ON "inventory_items"("companyId", "siteId", "materialId");
CREATE UNIQUE INDEX "payslips_companyId_payrollRunId_employeeId_key" ON "payslips"("companyId", "payrollRunId", "employeeId");
CREATE UNIQUE INDEX "performance_companyId_employeeId_year_quarter_key" ON "performance"("companyId", "employeeId", "year", "quarter");
CREATE INDEX "permission_grants_companyId_idx" ON "permission_grants"("companyId");
CREATE UNIQUE INDEX "permission_grants_companyId_userId_permission_key" ON "permission_grants"("companyId", "userId", "permission");
CREATE UNIQUE INDEX "properties_companyId_propertyCode_key" ON "properties"("companyId", "propertyCode");

-- AddForeignKey: ReportExport
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PermissionGrant -> Company
ALTER TABLE "permission_grants" ADD CONSTRAINT "permission_grants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER');
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EodReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');
CREATE TYPE "EscalationTriggerType" AS ENUM ('LEAD_STALE', 'ATTENDANCE_MISSED', 'LEAVE_PENDING', 'APPROVAL_PENDING', 'TASK_OVERDUE');
CREATE TYPE "EscalationEventStatus" AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'PAID', 'CANCELLED');
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');
CREATE TYPE "SiteStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
CREATE TYPE "SitePhaseStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "LabourType" AS ENUM ('SKILLED', 'UNSKILLED', 'SUPERVISOR');
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE "IncentiveStatus" AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- DropIndex
DROP INDEX IF EXISTS "users_clerkId_key";

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "checkInPhoto" TEXT,
ADD COLUMN IF NOT EXISTS "checkOutPhoto" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "settings" JSONB;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "designations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" DROP COLUMN IF EXISTS "clerkInvitationId",
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "brokerId" TEXT,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "locality" TEXT,
ADD COLUMN IF NOT EXISTS "propertyCode" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerkId",
ADD COLUMN IF NOT EXISTS "backupCodes" JSONB,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "hashedPassword" TEXT,
ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "totpSecret" TEXT,
ADD COLUMN IF NOT EXISTS "totpVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "device_registrations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "device_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attendance_corrections" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "attendanceId" TEXT,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedCheckIn" TIMESTAMP(3),
    "requestedCheckOut" TIMESTAMP(3),
    "requestedStatus" "AttendanceStatus",
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payroll_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEarnings" DECIMAL(14,2),
    "totalDeductions" DECIMAL(14,2),
    "totalNetPay" DECIMAL(14,2),
    "employeeCount" INTEGER,
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payslips" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "earnings" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "grossPay" DECIMAL(14,2) NOT NULL,
    "totalDeductions" DECIMAL(14,2) NOT NULL,
    "netPay" DECIMAL(14,2) NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "construction_sites" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" DATE,
    "endDate" DATE,
    "budget" DECIMAL(14,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "construction_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "site_phases" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "status" "SitePhaseStatus" NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vendors" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "materials" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "material_inward" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "receivedDate" DATE NOT NULL,
    "notes" TEXT,
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "material_inward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "inventory_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityOnHand" DECIMAL(12,2) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "labour_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "labourName" TEXT NOT NULL,
    "labourType" "LabourType" NOT NULL DEFAULT 'UNSKILLED',
    "date" DATE NOT NULL,
    "hoursWorked" DECIMAL(5,1),
    "wagesAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "labour_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "progress_photos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "phaseId" TEXT,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "brokers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "commissionRate" DECIMAL(5,2),
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "dealers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "complaints" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "leave_allocations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leave_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "pipeline_commissions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "employeeId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "percentage" DECIMAL(5,2),
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pipeline_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "incentives" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "award" TEXT NOT NULL,
    "value" DECIMAL(14,2),
    "opportunityLabel" TEXT,
    "opportunityType" TEXT,
    "status" "IncentiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "incentives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_schedules" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_entries" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paymentDate" DATE NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expense_claims" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "receiptUrl" TEXT,
    "expenseDate" DATE NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "temp_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '2FA_CHALLENGE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "temp_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "eod_reports" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "accomplishments" TEXT NOT NULL,
    "challenges" TEXT,
    "tomorrowPlan" TEXT,
    "status" "EodReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "eod_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "escalation_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "EscalationTriggerType" NOT NULL,
    "config" JSONB NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "notifyRoles" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "escalation_events" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "status" "EscalationEventStatus" NOT NULL DEFAULT 'TRIGGERED',
    "notes" TEXT,
    CONSTRAINT "escalation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "task_comments" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "permission_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permission_grants_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY');
ALTER TABLE "public"."attendance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TABLE "attendance_corrections" ALTER COLUMN "requestedStatus" TYPE "AttendanceStatus_new" USING ("requestedStatus"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE IF EXISTS "AttendanceStatus_old";
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'PRESENT';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "device_registrations_companyId_idx" ON "device_registrations"("companyId");
CREATE INDEX IF NOT EXISTS "device_registrations_employeeId_idx" ON "device_registrations"("employeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "device_registrations_employeeId_deviceId_key" ON "device_registrations"("employeeId", "deviceId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_companyId_idx" ON "attendance_corrections"("companyId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_employeeId_idx" ON "attendance_corrections"("employeeId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_status_idx" ON "attendance_corrections"("status");
CREATE INDEX IF NOT EXISTS "payroll_runs_companyId_idx" ON "payroll_runs"("companyId");
CREATE INDEX IF NOT EXISTS "payroll_runs_status_idx" ON "payroll_runs"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "payroll_runs_companyId_periodStart_periodEnd_key" ON "payroll_runs"("companyId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "payslips_companyId_idx" ON "payslips"("companyId");
CREATE INDEX IF NOT EXISTS "payslips_employeeId_idx" ON "payslips"("employeeId");
CREATE INDEX IF NOT EXISTS "payslips_payrollRunId_idx" ON "payslips"("payrollRunId");
CREATE UNIQUE INDEX IF NOT EXISTS "payslips_payrollRunId_employeeId_key" ON "payslips"("payrollRunId", "employeeId");
CREATE INDEX IF NOT EXISTS "construction_sites_companyId_idx" ON "construction_sites"("companyId");
CREATE INDEX IF NOT EXISTS "construction_sites_status_idx" ON "construction_sites"("status");
CREATE INDEX IF NOT EXISTS "site_phases_siteId_idx" ON "site_phases"("siteId");
CREATE INDEX IF NOT EXISTS "vendors_companyId_idx" ON "vendors"("companyId");
CREATE INDEX IF NOT EXISTS "vendors_status_idx" ON "vendors"("status");
CREATE INDEX IF NOT EXISTS "materials_companyId_idx" ON "materials"("companyId");
CREATE INDEX IF NOT EXISTS "materials_category_idx" ON "materials"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "materials_companyId_name_key" ON "materials"("companyId", "name");
CREATE INDEX IF NOT EXISTS "material_inward_companyId_idx" ON "material_inward"("companyId");
CREATE INDEX IF NOT EXISTS "material_inward_vendorId_idx" ON "material_inward"("vendorId");
CREATE INDEX IF NOT EXISTS "material_inward_siteId_idx" ON "material_inward"("siteId");
CREATE INDEX IF NOT EXISTS "material_inward_materialId_idx" ON "material_inward"("materialId");
CREATE INDEX IF NOT EXISTS "material_inward_receivedDate_idx" ON "material_inward"("receivedDate");
CREATE INDEX IF NOT EXISTS "inventory_items_companyId_idx" ON "inventory_items"("companyId");
CREATE INDEX IF NOT EXISTS "inventory_items_siteId_idx" ON "inventory_items"("siteId");
CREATE INDEX IF NOT EXISTS "inventory_items_materialId_idx" ON "inventory_items"("materialId");
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_siteId_materialId_key" ON "inventory_items"("siteId", "materialId");
CREATE INDEX IF NOT EXISTS "labour_entries_companyId_idx" ON "labour_entries"("companyId");
CREATE INDEX IF NOT EXISTS "labour_entries_siteId_idx" ON "labour_entries"("siteId");
CREATE INDEX IF NOT EXISTS "labour_entries_date_idx" ON "labour_entries"("date");
CREATE INDEX IF NOT EXISTS "progress_photos_companyId_idx" ON "progress_photos"("companyId");
CREATE INDEX IF NOT EXISTS "progress_photos_siteId_idx" ON "progress_photos"("siteId");
CREATE INDEX IF NOT EXISTS "progress_photos_phaseId_idx" ON "progress_photos"("phaseId");
CREATE INDEX IF NOT EXISTS "progress_photos_takenAt_idx" ON "progress_photos"("takenAt");
CREATE INDEX IF NOT EXISTS "brokers_companyId_idx" ON "brokers"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "brokers_companyId_email_key" ON "brokers"("companyId", "email");
CREATE INDEX IF NOT EXISTS "dealers_companyId_idx" ON "dealers"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "dealers_companyId_email_key" ON "dealers"("companyId", "email");
CREATE INDEX IF NOT EXISTS "complaints_companyId_idx" ON "complaints"("companyId");
CREATE INDEX IF NOT EXISTS "complaints_customerId_idx" ON "complaints"("customerId");
CREATE INDEX IF NOT EXISTS "complaints_status_idx" ON "complaints"("status");
CREATE INDEX IF NOT EXISTS "leave_allocations_employeeId_year_idx" ON "leave_allocations"("employeeId", "year");
CREATE INDEX IF NOT EXISTS "leave_allocations_companyId_idx" ON "leave_allocations"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "leave_allocations_employeeId_companyId_year_leaveType_key" ON "leave_allocations"("employeeId", "companyId", "year", "leaveType");
CREATE INDEX IF NOT EXISTS "pipeline_commissions_companyId_idx" ON "pipeline_commissions"("companyId");
CREATE INDEX IF NOT EXISTS "pipeline_commissions_employeeId_idx" ON "pipeline_commissions"("employeeId");
CREATE INDEX IF NOT EXISTS "pipeline_commissions_status_idx" ON "pipeline_commissions"("status");
CREATE INDEX IF NOT EXISTS "pipeline_commissions_leadId_idx" ON "pipeline_commissions"("leadId");
CREATE INDEX IF NOT EXISTS "pipeline_commissions_bookingId_idx" ON "pipeline_commissions"("bookingId");
CREATE INDEX IF NOT EXISTS "incentives_companyId_idx" ON "incentives"("companyId");
CREATE INDEX IF NOT EXISTS "incentives_status_idx" ON "incentives"("status");
CREATE INDEX IF NOT EXISTS "payment_schedules_companyId_idx" ON "payment_schedules"("companyId");
CREATE INDEX IF NOT EXISTS "payment_schedules_bookingId_idx" ON "payment_schedules"("bookingId");
CREATE INDEX IF NOT EXISTS "payment_schedules_status_idx" ON "payment_schedules"("status");
CREATE INDEX IF NOT EXISTS "payment_schedules_dueDate_idx" ON "payment_schedules"("dueDate");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_schedules_bookingId_installmentNumber_key" ON "payment_schedules"("bookingId", "installmentNumber");
CREATE INDEX IF NOT EXISTS "payment_entries_companyId_idx" ON "payment_entries"("companyId");
CREATE INDEX IF NOT EXISTS "payment_entries_bookingId_idx" ON "payment_entries"("bookingId");
CREATE INDEX IF NOT EXISTS "payment_entries_paymentDate_idx" ON "payment_entries"("paymentDate");
CREATE INDEX IF NOT EXISTS "expense_claims_companyId_idx" ON "expense_claims"("companyId");
CREATE INDEX IF NOT EXISTS "expense_claims_employeeId_idx" ON "expense_claims"("employeeId");
CREATE INDEX IF NOT EXISTS "expense_claims_status_idx" ON "expense_claims"("status");
CREATE INDEX IF NOT EXISTS "expense_claims_expenseDate_idx" ON "expense_claims"("expenseDate");
CREATE INDEX IF NOT EXISTS "security_events_companyId_idx" ON "security_events"("companyId");
CREATE INDEX IF NOT EXISTS "security_events_eventType_idx" ON "security_events"("eventType");
CREATE INDEX IF NOT EXISTS "security_events_createdAt_idx" ON "security_events"("createdAt");
CREATE INDEX IF NOT EXISTS "security_events_userId_idx" ON "security_events"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON "refresh_tokens"("token");
CREATE INDEX IF NOT EXISTS "refresh_tokens_companyId_idx" ON "refresh_tokens"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "temp_tokens_token_key" ON "temp_tokens"("token");
CREATE INDEX IF NOT EXISTS "temp_tokens_userId_idx" ON "temp_tokens"("userId");
CREATE INDEX IF NOT EXISTS "temp_tokens_token_idx" ON "temp_tokens"("token");
CREATE INDEX IF NOT EXISTS "temp_tokens_expiresAt_idx" ON "temp_tokens"("expiresAt");
CREATE INDEX IF NOT EXISTS "eod_reports_companyId_idx" ON "eod_reports"("companyId");
CREATE INDEX IF NOT EXISTS "eod_reports_employeeId_idx" ON "eod_reports"("employeeId");
CREATE INDEX IF NOT EXISTS "eod_reports_reportDate_idx" ON "eod_reports"("reportDate");
CREATE INDEX IF NOT EXISTS "eod_reports_status_idx" ON "eod_reports"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "eod_reports_employeeId_companyId_reportDate_key" ON "eod_reports"("employeeId", "companyId", "reportDate");
CREATE INDEX IF NOT EXISTS "escalation_rules_companyId_idx" ON "escalation_rules"("companyId");
CREATE INDEX IF NOT EXISTS "escalation_rules_triggerType_idx" ON "escalation_rules"("triggerType");
CREATE INDEX IF NOT EXISTS "escalation_events_companyId_idx" ON "escalation_events"("companyId");
CREATE INDEX IF NOT EXISTS "escalation_events_ruleId_idx" ON "escalation_events"("ruleId");
CREATE INDEX IF NOT EXISTS "escalation_events_entityType_entityId_idx" ON "escalation_events"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "escalation_events_status_idx" ON "escalation_events"("status");
CREATE INDEX IF NOT EXISTS "task_comments_assignmentId_idx" ON "task_comments"("assignmentId");
CREATE INDEX IF NOT EXISTS "task_comments_companyId_idx" ON "task_comments"("companyId");
CREATE INDEX IF NOT EXISTS "task_comments_authorId_idx" ON "task_comments"("authorId");
CREATE INDEX IF NOT EXISTS "permission_grants_userId_idx" ON "permission_grants"("userId");
CREATE INDEX IF NOT EXISTS "permission_grants_permission_idx" ON "permission_grants"("permission");
CREATE UNIQUE INDEX IF NOT EXISTS "permission_grants_userId_permission_key" ON "permission_grants"("userId", "permission");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_logs_companyId_idx" ON "activity_logs"("companyId");
CREATE INDEX IF NOT EXISTS "activity_logs_performedById_idx" ON "activity_logs"("performedById");
CREATE INDEX IF NOT EXISTS "attendance_companyId_idx" ON "attendance"("companyId");
CREATE INDEX IF NOT EXISTS "attendance_employeeId_idx" ON "attendance"("employeeId");
CREATE INDEX IF NOT EXISTS "attendance_date_idx" ON "attendance"("date");
CREATE INDEX IF NOT EXISTS "attendance_status_idx" ON "attendance"("status");
CREATE INDEX IF NOT EXISTS "bookings_companyId_idx" ON "bookings"("companyId");
CREATE INDEX IF NOT EXISTS "bookings_propertyId_idx" ON "bookings"("propertyId");
CREATE INDEX IF NOT EXISTS "bookings_customerId_idx" ON "bookings"("customerId");
CREATE INDEX IF NOT EXISTS "bookings_assignedToEmployeeId_idx" ON "bookings"("assignedToEmployeeId");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");
CREATE INDEX IF NOT EXISTS "customers_companyId_idx" ON "customers"("companyId");
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers"("email");
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers"("phone");
CREATE INDEX IF NOT EXISTS "departments_companyId_idx" ON "departments"("companyId");
CREATE INDEX IF NOT EXISTS "designations_companyId_idx" ON "designations"("companyId");
CREATE INDEX IF NOT EXISTS "designations_departmentId_idx" ON "designations"("departmentId");
CREATE INDEX IF NOT EXISTS "employee_assignments_companyId_idx" ON "employee_assignments"("companyId");
CREATE INDEX IF NOT EXISTS "employee_assignments_entityId_idx" ON "employee_assignments"("entityId");
CREATE INDEX IF NOT EXISTS "employees_companyId_idx" ON "employees"("companyId");
CREATE INDEX IF NOT EXISTS "employees_departmentId_idx" ON "employees"("departmentId");
CREATE INDEX IF NOT EXISTS "employees_designationId_idx" ON "employees"("designationId");
CREATE INDEX IF NOT EXISTS "employees_managerId_idx" ON "employees"("managerId");
CREATE INDEX IF NOT EXISTS "employees_status_idx" ON "employees"("status");
CREATE INDEX IF NOT EXISTS "leads_companyId_idx" ON "leads"("companyId");
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads"("status");
CREATE INDEX IF NOT EXISTS "leads_source_idx" ON "leads"("source");
CREATE INDEX IF NOT EXISTS "leads_assignedToEmployeeId_idx" ON "leads"("assignedToEmployeeId");
CREATE INDEX IF NOT EXISTS "leads_propertyId_idx" ON "leads"("propertyId");
CREATE INDEX IF NOT EXISTS "leave_requests_companyId_idx" ON "leave_requests"("companyId");
CREATE INDEX IF NOT EXISTS "leave_requests_employeeId_idx" ON "leave_requests"("employeeId");
CREATE INDEX IF NOT EXISTS "leave_requests_status_idx" ON "leave_requests"("status");
CREATE INDEX IF NOT EXISTS "leave_requests_startDate_endDate_idx" ON "leave_requests"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "notifications_companyId_idx" ON "notifications"("companyId");
CREATE INDEX IF NOT EXISTS "performance_companyId_idx" ON "performance"("companyId");
CREATE INDEX IF NOT EXISTS "performance_employeeId_idx" ON "performance"("employeeId");
CREATE INDEX IF NOT EXISTS "performance_year_quarter_idx" ON "performance"("year", "quarter");
CREATE UNIQUE INDEX IF NOT EXISTS "properties_propertyCode_key" ON "properties"("propertyCode");
CREATE INDEX IF NOT EXISTS "properties_companyId_idx" ON "properties"("companyId");
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties"("status");
CREATE INDEX IF NOT EXISTS "properties_type_idx" ON "properties"("type");
CREATE INDEX IF NOT EXISTS "properties_city_idx" ON "properties"("city");
CREATE INDEX IF NOT EXISTS "properties_assignedToEmployeeId_idx" ON "properties"("assignedToEmployeeId");
CREATE INDEX IF NOT EXISTS "properties_companyId_status_idx" ON "properties"("companyId", "status");
CREATE INDEX IF NOT EXISTS "site_visits_companyId_idx" ON "site_visits"("companyId");
CREATE INDEX IF NOT EXISTS "site_visits_propertyId_idx" ON "site_visits"("propertyId");
CREATE INDEX IF NOT EXISTS "site_visits_customerId_idx" ON "site_visits"("customerId");
CREATE INDEX IF NOT EXISTS "site_visits_assignedToEmployeeId_idx" ON "site_visits"("assignedToEmployeeId");
CREATE INDEX IF NOT EXISTS "site_visits_status_idx" ON "site_visits"("status");
CREATE INDEX IF NOT EXISTS "site_visits_scheduledDate_idx" ON "site_visits"("scheduledDate");
CREATE INDEX IF NOT EXISTS "users_companyId_idx" ON "users"("companyId");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "device_registrations" ADD CONSTRAINT "device_registrations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "device_registrations" ADD CONSTRAINT "device_registrations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_sites" ADD CONSTRAINT "construction_sites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "site_phases" ADD CONSTRAINT "site_phases_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "construction_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "materials" ADD CONSTRAINT "materials_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_inward" ADD CONSTRAINT "material_inward_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_inward" ADD CONSTRAINT "material_inward_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_inward" ADD CONSTRAINT "material_inward_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "construction_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_inward" ADD CONSTRAINT "material_inward_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "construction_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "labour_entries" ADD CONSTRAINT "labour_entries_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "construction_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "construction_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "site_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_allocations" ADD CONSTRAINT "leave_allocations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "temp_tokens" ADD CONSTRAINT "temp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "temp_tokens" ADD CONSTRAINT "temp_tokens_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "eod_reports" ADD CONSTRAINT "eod_reports_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "eod_reports" ADD CONSTRAINT "eod_reports_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "eod_reports" ADD CONSTRAINT "eod_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "escalation_rules" ADD CONSTRAINT "escalation_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "escalation_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "employee_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permission_grants" ADD CONSTRAINT "permission_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permission_grants" ADD CONSTRAINT "permission_grants_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

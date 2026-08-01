-- CreateEnum
CREATE TYPE "WarningCategory" AS ENUM ('ATTENDANCE', 'TASK_PERFORMANCE', 'CONDUCT', 'SAFETY', 'DOCUMENTATION', 'POLICY_VIOLATION', 'CLIENT_COMPLAINT');

-- CreateEnum
CREATE TYPE "WarningSeverity" AS ENUM ('LEVEL_1_VERBAL', 'LEVEL_2_WRITTEN', 'LEVEL_3_FINAL');

-- CreateEnum
CREATE TYPE "PayrollHoldSource" AS ENUM ('TASK_ENGINE', 'WARNING_ENGINE', 'ATTENDANCE_ENGINE', 'HR_MANUAL', 'OWNER_MANUAL');

-- CreateEnum
CREATE TYPE "PayrollHoldType" AS ENUM ('FULL_HOLD', 'PARTIAL_HOLD', 'INCENTIVE_HOLD', 'DEFERRED_PAYMENT');

-- CreateEnum
CREATE TYPE "PayrollHoldStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'ACTIVE_HOLD', 'RELEASE_REQUESTED', 'RELEASED', 'REJECTED');

-- CreateTable
CREATE TABLE "warnings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "issuerId" TEXT,
    "approvalId" TEXT,
    "category" "WarningCategory" NOT NULL,
    "severity" "WarningSeverity" NOT NULL,
    "reason" TEXT NOT NULL,
    "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warning_histories" (
    "id" TEXT NOT NULL,
    "warningId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warning_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_holds" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "approvalId" TEXT,
    "source" "PayrollHoldSource" NOT NULL,
    "sourceId" TEXT,
    "holdType" "PayrollHoldType" NOT NULL,
    "amount" DECIMAL(65,30),
    "reason" TEXT NOT NULL,
    "evidenceUri" TEXT,
    "createdById" TEXT,
    "status" "PayrollHoldStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_hold_histories" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_hold_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warnings_approvalId_key" ON "warnings"("approvalId");

-- CreateIndex
CREATE INDEX "warnings_companyId_idx" ON "warnings"("companyId");

-- CreateIndex
CREATE INDEX "warnings_employeeId_idx" ON "warnings"("employeeId");

-- CreateIndex
CREATE INDEX "warning_histories_warningId_idx" ON "warning_histories"("warningId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_holds_approvalId_key" ON "payroll_holds"("approvalId");

-- CreateIndex
CREATE INDEX "payroll_holds_companyId_idx" ON "payroll_holds"("companyId");

-- CreateIndex
CREATE INDEX "payroll_holds_employeeId_idx" ON "payroll_holds"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_hold_histories_holdId_idx" ON "payroll_hold_histories"("holdId");

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warnings" ADD CONSTRAINT "warnings_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_histories" ADD CONSTRAINT "warning_histories_warningId_fkey" FOREIGN KEY ("warningId") REFERENCES "warnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warning_histories" ADD CONSTRAINT "warning_histories_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_holds" ADD CONSTRAINT "payroll_holds_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_holds" ADD CONSTRAINT "payroll_holds_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_holds" ADD CONSTRAINT "payroll_holds_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_holds" ADD CONSTRAINT "payroll_holds_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_holds" ADD CONSTRAINT "payroll_holds_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_hold_histories" ADD CONSTRAINT "payroll_hold_histories_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "payroll_holds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_hold_histories" ADD CONSTRAINT "payroll_hold_histories_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

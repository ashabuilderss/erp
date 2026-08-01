-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('GENERAL', 'CONTRACT', 'INVOICE', 'REPORT', 'PHOTO', 'DRAWING', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'SHEET', 'PDF');

-- CreateEnum
CREATE TYPE "ExportSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PerformancePeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- AlterTable
ALTER TABLE "attendance_corrections" ADD COLUMN     "requestedCheckIn" TEXT,
ADD COLUMN     "requestedCheckOut" TEXT,
ADD COLUMN     "requestedStatus" TEXT;

-- CreateTable
CREATE TABLE "performance_scores" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" "PerformancePeriod" NOT NULL,
    "taskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eodScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "managerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "calculatedById" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_ratings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "performanceScoreId" TEXT NOT NULL,
    "ratedById" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "presentEmployees" INTEGER NOT NULL DEFAULT 0,
    "absentEmployees" INTEGER NOT NULL DEFAULT 0,
    "lateEmployees" INTEGER NOT NULL DEFAULT 0,
    "overdueTasks" INTEGER NOT NULL DEFAULT 0,
    "activeWarnings" INTEGER NOT NULL DEFAULT 0,
    "activePayrollHolds" INTEGER NOT NULL DEFAULT 0,
    "pendingApprovals" INTEGER NOT NULL DEFAULT 0,
    "collectionStatus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "siteDelays" INTEGER NOT NULL DEFAULT 0,
    "materialAlerts" INTEGER NOT NULL DEFAULT 0,
    "criticalAlerts" INTEGER NOT NULL DEFAULT 0,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedEventId" TEXT,
    "lastProcessedCorrelationId" TEXT,
    "lastProjectionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_alerts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "sheetId" TEXT,
    "sheetName" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncSchedule" TEXT,
    "allowedRoles" JSONB NOT NULL,
    "grantedUsers" JSONB NOT NULL DEFAULT '[]',
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exportConfigId" TEXT,
    "exportType" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "requestedById" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "approvalId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "exportLogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "approvalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvalId" TEXT,
    "previousState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "targetRoles" JSONB NOT NULL DEFAULT '[]',
    "targetEmployees" JSONB NOT NULL DEFAULT '[]',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_receipts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_registries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "storageObjectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'COMPANY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_scores_companyId_idx" ON "performance_scores"("companyId");

-- CreateIndex
CREATE INDEX "performance_scores_employeeId_idx" ON "performance_scores"("employeeId");

-- CreateIndex
CREATE INDEX "performance_scores_period_idx" ON "performance_scores"("period");

-- CreateIndex
CREATE INDEX "performance_scores_calculatedAt_idx" ON "performance_scores"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "performance_scores_companyId_employeeId_period_periodType_key" ON "performance_scores"("companyId", "employeeId", "period", "periodType");

-- CreateIndex
CREATE INDEX "manager_ratings_companyId_idx" ON "manager_ratings"("companyId");

-- CreateIndex
CREATE INDEX "manager_ratings_performanceScoreId_idx" ON "manager_ratings"("performanceScoreId");

-- CreateIndex
CREATE INDEX "manager_ratings_ratedById_idx" ON "manager_ratings"("ratedById");

-- CreateIndex
CREATE INDEX "dashboard_kpi_snapshots_companyId_idx" ON "dashboard_kpi_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "dashboard_kpi_snapshots_snapshotDate_idx" ON "dashboard_kpi_snapshots"("snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_kpi_snapshots_companyId_snapshotDate_key" ON "dashboard_kpi_snapshots"("companyId", "snapshotDate");

-- CreateIndex
CREATE INDEX "dashboard_alerts_companyId_idx" ON "dashboard_alerts"("companyId");

-- CreateIndex
CREATE INDEX "dashboard_alerts_severity_idx" ON "dashboard_alerts"("severity");

-- CreateIndex
CREATE INDEX "dashboard_alerts_status_idx" ON "dashboard_alerts"("status");

-- CreateIndex
CREATE INDEX "dashboard_alerts_createdAt_idx" ON "dashboard_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "export_configs_companyId_idx" ON "export_configs"("companyId");

-- CreateIndex
CREATE INDEX "export_configs_syncEnabled_idx" ON "export_configs"("syncEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "export_configs_companyId_exportType_key" ON "export_configs"("companyId", "exportType");

-- CreateIndex
CREATE INDEX "export_logs_companyId_idx" ON "export_logs"("companyId");

-- CreateIndex
CREATE INDEX "export_logs_exportType_idx" ON "export_logs"("exportType");

-- CreateIndex
CREATE INDEX "export_logs_requestedById_idx" ON "export_logs"("requestedById");

-- CreateIndex
CREATE INDEX "export_logs_createdAt_idx" ON "export_logs"("createdAt");

-- CreateIndex
CREATE INDEX "download_logs_companyId_idx" ON "download_logs"("companyId");

-- CreateIndex
CREATE INDEX "download_logs_exportLogId_idx" ON "download_logs"("exportLogId");

-- CreateIndex
CREATE INDEX "download_logs_userId_idx" ON "download_logs"("userId");

-- CreateIndex
CREATE INDEX "download_logs_createdAt_idx" ON "download_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_records_companyId_idx" ON "audit_records"("companyId");

-- CreateIndex
CREATE INDEX "audit_records_entityType_entityId_idx" ON "audit_records"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_records_userId_idx" ON "audit_records"("userId");

-- CreateIndex
CREATE INDEX "audit_records_action_idx" ON "audit_records"("action");

-- CreateIndex
CREATE INDEX "audit_records_createdAt_idx" ON "audit_records"("createdAt");

-- CreateIndex
CREATE INDEX "deletion_logs_companyId_idx" ON "deletion_logs"("companyId");

-- CreateIndex
CREATE INDEX "deletion_logs_entityType_entityId_idx" ON "deletion_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "deletion_logs_userId_idx" ON "deletion_logs"("userId");

-- CreateIndex
CREATE INDEX "deletion_logs_createdAt_idx" ON "deletion_logs"("createdAt");

-- CreateIndex
CREATE INDEX "announcements_companyId_idx" ON "announcements"("companyId");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_publishedAt_idx" ON "announcements"("publishedAt");

-- CreateIndex
CREATE INDEX "announcements_createdById_idx" ON "announcements"("createdById");

-- CreateIndex
CREATE INDEX "announcement_receipts_companyId_idx" ON "announcement_receipts"("companyId");

-- CreateIndex
CREATE INDEX "announcement_receipts_announcementId_idx" ON "announcement_receipts"("announcementId");

-- CreateIndex
CREATE INDEX "announcement_receipts_userId_idx" ON "announcement_receipts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_receipts_announcementId_userId_key" ON "announcement_receipts"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "document_registries_companyId_idx" ON "document_registries"("companyId");

-- CreateIndex
CREATE INDEX "document_registries_category_idx" ON "document_registries"("category");

-- CreateIndex
CREATE INDEX "document_registries_uploadedById_idx" ON "document_registries"("uploadedById");

-- CreateIndex
CREATE INDEX "document_registries_createdAt_idx" ON "document_registries"("createdAt");

-- CreateIndex
CREATE INDEX "document_access_logs_companyId_idx" ON "document_access_logs"("companyId");

-- CreateIndex
CREATE INDEX "document_access_logs_documentId_idx" ON "document_access_logs"("documentId");

-- CreateIndex
CREATE INDEX "document_access_logs_userId_idx" ON "document_access_logs"("userId");

-- CreateIndex
CREATE INDEX "document_access_logs_action_idx" ON "document_access_logs"("action");

-- CreateIndex
CREATE INDEX "document_access_logs_createdAt_idx" ON "document_access_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "performance_scores" ADD CONSTRAINT "performance_scores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_scores" ADD CONSTRAINT "performance_scores_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_ratings" ADD CONSTRAINT "manager_ratings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_ratings" ADD CONSTRAINT "manager_ratings_performanceScoreId_fkey" FOREIGN KEY ("performanceScoreId") REFERENCES "performance_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_ratings" ADD CONSTRAINT "manager_ratings_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_kpi_snapshots" ADD CONSTRAINT "dashboard_kpi_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_alerts" ADD CONSTRAINT "dashboard_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_alerts" ADD CONSTRAINT "dashboard_alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_configs" ADD CONSTRAINT "export_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_exportConfigId_fkey" FOREIGN KEY ("exportConfigId") REFERENCES "export_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_logs" ADD CONSTRAINT "download_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_logs" ADD CONSTRAINT "download_logs_exportLogId_fkey" FOREIGN KEY ("exportLogId") REFERENCES "export_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_logs" ADD CONSTRAINT "download_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_logs" ADD CONSTRAINT "deletion_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_logs" ADD CONSTRAINT "deletion_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_receipts" ADD CONSTRAINT "announcement_receipts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_receipts" ADD CONSTRAINT "announcement_receipts_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_receipts" ADD CONSTRAINT "announcement_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_registries" ADD CONSTRAINT "document_registries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_registries" ADD CONSTRAINT "document_registries_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_registries" ADD CONSTRAINT "document_registries_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_registries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

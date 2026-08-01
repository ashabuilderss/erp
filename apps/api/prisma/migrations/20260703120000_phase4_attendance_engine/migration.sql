-- CreateEnum
CREATE TYPE "AttendancePeriodStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED', 'PAYROLL_LOCKED');

-- CreateEnum
CREATE TYPE "PunchType" AS ENUM ('IN', 'OUT', 'BREAK_START', 'BREAK_END');

-- CreateEnum
CREATE TYPE "DayAggregateStatus" AS ENUM ('COMPLETED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SELFIE', 'VIDEO', 'BIOMETRIC', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('LATE_CHECKIN', 'EARLY_CHECKOUT', 'OUTSIDE_GEOFENCE', 'MOCK_LOCATION', 'DEVICE_UNTRUSTED', 'SELFIE_VERIFICATION_FAILED', 'FACE_MISMATCH', 'OFFLINE_LIMIT_EXCEEDED', 'MISSING_CHECKOUT', 'DUPLICATE_PUNCH', 'UNKNOWN_LOCATION');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_companyId_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_verifiedById_fkey";

-- DropForeignKey
ALTER TABLE "attendance_corrections" DROP CONSTRAINT "attendance_corrections_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "attendance_corrections" DROP CONSTRAINT "attendance_corrections_attendanceId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_corrections" DROP CONSTRAINT "attendance_corrections_companyId_fkey";

-- DropIndex
DROP INDEX "attendance_corrections_status_idx";

-- AlterTable
ALTER TABLE "attendance_corrections" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "attendanceId",
DROP COLUMN "date",
DROP COLUMN "notes",
DROP COLUMN "requestedCheckIn",
DROP COLUMN "requestedCheckOut",
DROP COLUMN "requestedStatus",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "approvalRequestId" TEXT,
ADD COLUMN     "dayAggregateId" TEXT;

-- DropTable
DROP TABLE "attendance";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "CorrectionStatus";

-- CreateTable
CREATE TABLE "storage_objects" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "objectVersion" TEXT,
    "checksum" TEXT,
    "encryptionKeyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_periods" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AttendancePeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_punches" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "punchType" "PunchType" NOT NULL,
    "deviceId" TEXT,
    "locationId" TEXT,
    "clientGeneratedUUID" TEXT,
    "payloadHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_punches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_day_aggregates" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalBreakMinutes" INTEGER NOT NULL DEFAULT 0,
    "firstPunchAt" TIMESTAMP(3),
    "lastPunchAt" TIMESTAMP(3),
    "status" "DayAggregateStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_day_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignment_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftDefinitionId" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "gracePeriodMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_assignment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dayAggregateId" TEXT NOT NULL,
    "shiftAssignmentSnapshotId" TEXT NOT NULL,
    "sessionStart" TIMESTAMP(3) NOT NULL,
    "sessionEnd" TIMESTAMP(3),
    "totalWorkedMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalBreakMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "firstPunchId" TEXT,
    "lastPunchId" TEXT,
    "sessionStatus" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_versions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "radiusMeters" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofence_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_evidence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "punchId" TEXT,
    "correctionId" TEXT,
    "type" "EvidenceType" NOT NULL,
    "storageObjectId" TEXT NOT NULL,
    "geofenceVersionId" TEXT,
    "gpsAccuracy" DECIMAL(10,2),
    "mockLocationDetected" BOOLEAN NOT NULL DEFAULT false,
    "developerModeActive" BOOLEAN NOT NULL DEFAULT false,
    "locationProvider" TEXT,
    "movementSpeed" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_anomalies" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "attendanceSessionId" TEXT,
    "attendanceDayAggregateId" TEXT,
    "attendanceCorrectionId" TEXT,
    "anomalyType" "AnomalyType" NOT NULL,
    "severity" "AnomalySeverity" NOT NULL DEFAULT 'MEDIUM',
    "detectedBy" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "attendance_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_policy_versions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "policyConfiguration" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendar_versions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "calendarData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holiday_calendar_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_finalization_batches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "attendancePeriodId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "holidayCalendarVersionId" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PROCESSING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "finalizedById" TEXT NOT NULL,

    CONSTRAINT "attendance_finalization_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_definitions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_shift_assignments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "shiftDefinitionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_histories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "actorId" TEXT,
    "transitionType" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_summaries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendancePeriodId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "attendanceFinalizationBatchId" TEXT NOT NULL,
    "payableMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedEventId" TEXT,
    "lastProcessedCorrelationId" TEXT,
    "rebuiltAt" TIMESTAMP(3),
    "lastProjectionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_attendance_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendancePeriodId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "shiftAssignmentSnapshotId" TEXT,
    "holidayCalendarVersionId" TEXT NOT NULL,
    "attendanceFinalizationBatchId" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedEventId" TEXT,
    "lastProcessedCorrelationId" TEXT,
    "rebuiltAt" TIMESTAMP(3),
    "lastProjectionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_attendance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_objects_companyId_idx" ON "storage_objects"("companyId");

-- CreateIndex
CREATE INDEX "attendance_periods_companyId_idx" ON "attendance_periods"("companyId");

-- CreateIndex
CREATE INDEX "attendance_periods_status_idx" ON "attendance_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_periods_companyId_startDate_endDate_key" ON "attendance_periods"("companyId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_punches_clientGeneratedUUID_key" ON "attendance_punches"("clientGeneratedUUID");

-- CreateIndex
CREATE INDEX "attendance_punches_companyId_idx" ON "attendance_punches"("companyId");

-- CreateIndex
CREATE INDEX "attendance_punches_employeeId_idx" ON "attendance_punches"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_punches_timestamp_idx" ON "attendance_punches"("timestamp");

-- CreateIndex
CREATE INDEX "attendance_day_aggregates_companyId_idx" ON "attendance_day_aggregates"("companyId");

-- CreateIndex
CREATE INDEX "attendance_day_aggregates_employeeId_idx" ON "attendance_day_aggregates"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_day_aggregates_date_idx" ON "attendance_day_aggregates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_day_aggregates_companyId_employeeId_date_key" ON "attendance_day_aggregates"("companyId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "shift_assignment_snapshots_companyId_idx" ON "shift_assignment_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "shift_assignment_snapshots_employeeId_idx" ON "shift_assignment_snapshots"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_sessions_companyId_idx" ON "attendance_sessions"("companyId");

-- CreateIndex
CREATE INDEX "attendance_sessions_employeeId_idx" ON "attendance_sessions"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_sessions_dayAggregateId_idx" ON "attendance_sessions"("dayAggregateId");

-- CreateIndex
CREATE INDEX "geofence_versions_companyId_idx" ON "geofence_versions"("companyId");

-- CreateIndex
CREATE INDEX "attendance_evidence_companyId_idx" ON "attendance_evidence"("companyId");

-- CreateIndex
CREATE INDEX "attendance_evidence_punchId_idx" ON "attendance_evidence"("punchId");

-- CreateIndex
CREATE INDEX "attendance_evidence_correctionId_idx" ON "attendance_evidence"("correctionId");

-- CreateIndex
CREATE INDEX "attendance_anomalies_companyId_idx" ON "attendance_anomalies"("companyId");

-- CreateIndex
CREATE INDEX "attendance_anomalies_employeeId_idx" ON "attendance_anomalies"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_anomalies_resolved_idx" ON "attendance_anomalies"("resolved");

-- CreateIndex
CREATE INDEX "attendance_policy_versions_companyId_idx" ON "attendance_policy_versions"("companyId");

-- CreateIndex
CREATE INDEX "holiday_calendar_versions_companyId_idx" ON "holiday_calendar_versions"("companyId");

-- CreateIndex
CREATE INDEX "attendance_finalization_batches_companyId_idx" ON "attendance_finalization_batches"("companyId");

-- CreateIndex
CREATE INDEX "attendance_finalization_batches_attendancePeriodId_idx" ON "attendance_finalization_batches"("attendancePeriodId");

-- CreateIndex
CREATE INDEX "shift_definitions_companyId_idx" ON "shift_definitions"("companyId");

-- CreateIndex
CREATE INDEX "employee_shift_assignments_companyId_idx" ON "employee_shift_assignments"("companyId");

-- CreateIndex
CREATE INDEX "employee_shift_assignments_employeeId_idx" ON "employee_shift_assignments"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_histories_companyId_idx" ON "attendance_histories"("companyId");

-- CreateIndex
CREATE INDEX "attendance_histories_targetType_targetId_idx" ON "attendance_histories"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "attendance_summaries_companyId_idx" ON "attendance_summaries"("companyId");

-- CreateIndex
CREATE INDEX "attendance_summaries_attendancePeriodId_idx" ON "attendance_summaries"("attendancePeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_summaries_companyId_employeeId_attendancePeriodI_key" ON "attendance_summaries"("companyId", "employeeId", "attendancePeriodId");

-- CreateIndex
CREATE INDEX "payroll_attendance_snapshots_companyId_idx" ON "payroll_attendance_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "payroll_attendance_snapshots_attendancePeriodId_idx" ON "payroll_attendance_snapshots"("attendancePeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_attendance_snapshots_companyId_employeeId_attendanc_key" ON "payroll_attendance_snapshots"("companyId", "employeeId", "attendancePeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_corrections_approvalRequestId_key" ON "attendance_corrections"("approvalRequestId");

-- AddForeignKey
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_periods" ADD CONSTRAINT "attendance_periods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_day_aggregates" ADD CONSTRAINT "attendance_day_aggregates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_day_aggregates" ADD CONSTRAINT "attendance_day_aggregates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment_snapshots" ADD CONSTRAINT "shift_assignment_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignment_snapshots" ADD CONSTRAINT "shift_assignment_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_dayAggregateId_fkey" FOREIGN KEY ("dayAggregateId") REFERENCES "attendance_day_aggregates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_shiftAssignmentSnapshotId_fkey" FOREIGN KEY ("shiftAssignmentSnapshotId") REFERENCES "shift_assignment_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_versions" ADD CONSTRAINT "geofence_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_evidence" ADD CONSTRAINT "attendance_evidence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_evidence" ADD CONSTRAINT "attendance_evidence_punchId_fkey" FOREIGN KEY ("punchId") REFERENCES "attendance_punches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_evidence" ADD CONSTRAINT "attendance_evidence_correctionId_fkey" FOREIGN KEY ("correctionId") REFERENCES "attendance_corrections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_evidence" ADD CONSTRAINT "attendance_evidence_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_evidence" ADD CONSTRAINT "attendance_evidence_geofenceVersionId_fkey" FOREIGN KEY ("geofenceVersionId") REFERENCES "geofence_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_attendanceDayAggregateId_fkey" FOREIGN KEY ("attendanceDayAggregateId") REFERENCES "attendance_day_aggregates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_attendanceCorrectionId_fkey" FOREIGN KEY ("attendanceCorrectionId") REFERENCES "attendance_corrections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_anomalies" ADD CONSTRAINT "attendance_anomalies_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_policy_versions" ADD CONSTRAINT "attendance_policy_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_policy_versions" ADD CONSTRAINT "attendance_policy_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendar_versions" ADD CONSTRAINT "holiday_calendar_versions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_finalization_batches" ADD CONSTRAINT "attendance_finalization_batches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_finalization_batches" ADD CONSTRAINT "attendance_finalization_batches_attendancePeriodId_fkey" FOREIGN KEY ("attendancePeriodId") REFERENCES "attendance_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_finalization_batches" ADD CONSTRAINT "attendance_finalization_batches_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "attendance_policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_finalization_batches" ADD CONSTRAINT "attendance_finalization_batches_holidayCalendarVersionId_fkey" FOREIGN KEY ("holidayCalendarVersionId") REFERENCES "holiday_calendar_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_finalization_batches" ADD CONSTRAINT "attendance_finalization_batches_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_dayAggregateId_fkey" FOREIGN KEY ("dayAggregateId") REFERENCES "attendance_day_aggregates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_definitions" ADD CONSTRAINT "shift_definitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_shiftDefinitionId_fkey" FOREIGN KEY ("shiftDefinitionId") REFERENCES "shift_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_histories" ADD CONSTRAINT "attendance_histories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_histories" ADD CONSTRAINT "attendance_histories_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_attendancePeriodId_fkey" FOREIGN KEY ("attendancePeriodId") REFERENCES "attendance_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "attendance_policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_attendanceFinalizationBatchId_fkey" FOREIGN KEY ("attendanceFinalizationBatchId") REFERENCES "attendance_finalization_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_attendancePeriodId_fkey" FOREIGN KEY ("attendancePeriodId") REFERENCES "attendance_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "attendance_policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_holidayCalendarVersionId_fkey" FOREIGN KEY ("holidayCalendarVersionId") REFERENCES "holiday_calendar_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_attendance_snapshots" ADD CONSTRAINT "payroll_attendance_snapshots_attendanceFinalizationBatchId_fkey" FOREIGN KEY ("attendanceFinalizationBatchId") REFERENCES "attendance_finalization_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


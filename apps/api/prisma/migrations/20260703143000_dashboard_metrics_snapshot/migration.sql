CREATE TABLE "dashboard_metrics_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "presentEmployees" INTEGER NOT NULL DEFAULT 0,
    "absentEmployees" INTEGER NOT NULL DEFAULT 0,
    "lateEmployees" INTEGER NOT NULL DEFAULT 0,
    "activeWarnings" INTEGER NOT NULL DEFAULT 0,
    "activePayrollHolds" INTEGER NOT NULL DEFAULT 0,
    "pendingApprovals" INTEGER NOT NULL DEFAULT 0,
    "overdueTasks" INTEGER NOT NULL DEFAULT 0,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedEventId" TEXT,
    "lastProcessedCorrelationId" TEXT,
    "rebuiltAt" TIMESTAMP(3),
    "lastProjectionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_metrics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_metrics_snapshots_companyId_snapshotDate_key" ON "dashboard_metrics_snapshots"("companyId", "snapshotDate");
CREATE INDEX "dashboard_metrics_snapshots_companyId_idx" ON "dashboard_metrics_snapshots"("companyId");
CREATE INDEX "dashboard_metrics_snapshots_snapshotDate_idx" ON "dashboard_metrics_snapshots"("snapshotDate");

ALTER TABLE "dashboard_metrics_snapshots" ADD CONSTRAINT "dashboard_metrics_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

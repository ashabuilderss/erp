-- CreateTable
CREATE TABLE "performance_trend_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodType" "PerformancePeriod" NOT NULL,
    "period" TEXT NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "trend" "TrendDirection" NOT NULL,
    "taskScore" DOUBLE PRECISION NOT NULL,
    "attendanceScore" DOUBLE PRECISION NOT NULL,
    "eodScore" DOUBLE PRECISION NOT NULL,
    "managerScore" DOUBLE PRECISION NOT NULL,
    "previousCompositeScore" DOUBLE PRECISION,
    "scoreDelta" DOUBLE PRECISION,
    "projectionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedEventId" TEXT,
    "lastProcessedCorrelationId" TEXT,
    "lastProjectionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_trend_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_trend_snapshots_companyId_idx" ON "performance_trend_snapshots"("companyId");

-- CreateIndex
CREATE INDEX "performance_trend_snapshots_employeeId_idx" ON "performance_trend_snapshots"("employeeId");

-- CreateIndex
CREATE INDEX "performance_trend_snapshots_periodType_idx" ON "performance_trend_snapshots"("periodType");

-- CreateIndex
CREATE INDEX "performance_trend_snapshots_period_idx" ON "performance_trend_snapshots"("period");

-- CreateIndex
CREATE UNIQUE INDEX "performance_trend_snapshots_companyId_employeeId_periodType_key" ON "performance_trend_snapshots"("companyId", "employeeId", "periodType", "period");

-- AddForeignKey
ALTER TABLE "performance_trend_snapshots" ADD CONSTRAINT "performance_trend_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_trend_snapshots" ADD CONSTRAINT "performance_trend_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

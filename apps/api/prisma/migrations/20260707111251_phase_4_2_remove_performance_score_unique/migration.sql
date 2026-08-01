-- DropIndex
DROP INDEX "performance_scores_companyId_employeeId_period_periodType_key";

-- CreateIndex
CREATE INDEX "performance_scores_companyId_employeeId_period_periodType_idx" ON "performance_scores"("companyId", "employeeId", "period", "periodType");

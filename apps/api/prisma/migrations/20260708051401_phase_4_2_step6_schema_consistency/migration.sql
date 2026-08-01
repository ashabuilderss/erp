/*
  Warnings:

  - The `format` column on the `report_exports` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `report_exports` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "ExportFormat" ADD VALUE 'EXCEL';

-- AlterTable
ALTER TABLE "export_configs" ADD COLUMN     "syncStatus" "ExportSyncStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "report_exports" DROP COLUMN "format",
ADD COLUMN     "format" "ExportFormat" NOT NULL DEFAULT 'CSV',
DROP COLUMN "status",
ADD COLUMN     "status" "ReportExportStatus" NOT NULL DEFAULT 'REQUESTED';

-- CreateIndex
CREATE INDEX "report_exports_status_idx" ON "report_exports"("status");

-- CreateEnum
CREATE TYPE "EvidenceReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateTable
CREATE TABLE "attendance_evidence_reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "punchId" TEXT,
    "reviewedById" TEXT NOT NULL,
    "status" "EvidenceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_evidence_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_evidence_reviews_companyId_idx" ON "attendance_evidence_reviews"("companyId");

-- CreateIndex
CREATE INDEX "attendance_evidence_reviews_evidenceId_idx" ON "attendance_evidence_reviews"("evidenceId");

-- CreateIndex
CREATE INDEX "attendance_evidence_reviews_punchId_idx" ON "attendance_evidence_reviews"("punchId");

-- CreateIndex
CREATE INDEX "attendance_evidence_reviews_reviewedById_idx" ON "attendance_evidence_reviews"("reviewedById");

-- CreateIndex
CREATE INDEX "attendance_evidence_reviews_status_idx" ON "attendance_evidence_reviews"("status");

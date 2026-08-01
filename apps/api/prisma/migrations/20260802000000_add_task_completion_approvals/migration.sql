-- CreateEnum
CREATE TYPE "TaskCompletionApprovalStatus" AS ENUM ('PENDING', 'MANAGER_ACKNOWLEDGED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "task_completion_approvals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "proofId" TEXT,
    "status" "TaskCompletionApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "managerId" TEXT,
    "managerAcknowledgedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "ownerApprovedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_completion_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_completion_approvals_taskId_key" ON "task_completion_approvals"("taskId");
CREATE INDEX "task_completion_approvals_companyId_idx" ON "task_completion_approvals"("companyId");

-- AddForeignKey
ALTER TABLE "task_completion_approvals" ADD CONSTRAINT "task_completion_approvals_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_completion_approvals" ADD CONSTRAINT "task_completion_approvals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

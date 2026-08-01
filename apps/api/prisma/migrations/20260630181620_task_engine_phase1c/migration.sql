-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('SITE_WORK', 'DOCUMENTATION', 'CLIENT_FOLLOWUP', 'PURCHASE', 'PAYMENT_COLLECTION', 'HR_ACTIVITY', 'ADMIN_ACTIVITY');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PENDING_VALIDATION', 'COMPLETED', 'OVERDUE');

-- CreateTable
CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_schedules" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_histories" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_proofs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "submissionUrl" TEXT NOT NULL,
    "comments" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerComments" TEXT,

    CONSTRAINT "task_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_extensions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "approvalId" TEXT,
    "requestedDueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_templates_companyId_idx" ON "task_templates"("companyId");

-- CreateIndex
CREATE INDEX "recurring_schedules_templateId_idx" ON "recurring_schedules"("templateId");

-- CreateIndex
CREATE INDEX "tasks_companyId_idx" ON "tasks"("companyId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "task_histories_taskId_idx" ON "task_histories"("taskId");

-- CreateIndex
CREATE INDEX "task_proofs_taskId_idx" ON "task_proofs"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_extensions_approvalId_key" ON "task_extensions"("approvalId");

-- CreateIndex
CREATE INDEX "task_extensions_taskId_idx" ON "task_extensions"("taskId");

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_extensions" ADD CONSTRAINT "task_extensions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_extensions" ADD CONSTRAINT "task_extensions_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

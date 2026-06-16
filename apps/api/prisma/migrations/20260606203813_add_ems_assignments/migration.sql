-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('PROPERTY', 'LEAD', 'SITE_VISIT', 'BOOKING');

-- CreateTable
CREATE TABLE "employee_assignments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "AssignmentType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_assignments_employeeId_type_idx" ON "employee_assignments"("employeeId", "type");

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

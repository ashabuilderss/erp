-- Phase A schema changes
-- Add MEDICAL leave type
ALTER TYPE "LeaveType" ADD VALUE 'MEDICAL';

-- Add documentUrl to leave_requests
ALTER TABLE "leave_requests" ADD COLUMN "documentUrl" TEXT;

-- Add EmployeeStaffType enum
CREATE TYPE "EmployeeStaffType" AS ENUM ('OFFICE', 'FIELD', 'HYBRID');

-- Add staffType to employees
ALTER TABLE "employees" ADD COLUMN "staffType" "EmployeeStaffType" DEFAULT 'OFFICE';

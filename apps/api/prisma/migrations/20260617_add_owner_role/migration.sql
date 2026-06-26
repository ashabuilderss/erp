-- Add OWNER role to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'OWNER' BEFORE 'ADMIN';

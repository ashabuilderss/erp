-- AlterTable
ALTER TABLE "approval_steps" ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "approval_template_steps" ADD COLUMN     "slaHours" INTEGER NOT NULL DEFAULT 24;

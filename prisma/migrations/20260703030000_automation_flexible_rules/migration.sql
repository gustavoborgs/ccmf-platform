-- AlterEnum
ALTER TYPE "AutomationType" ADD VALUE 'WHATSAPP';

-- CreateEnum
CREATE TYPE "AutomationSubjectType" AS ENUM ('LEAD', 'REGISTRATION');

-- DropIndex
DROP INDEX "automations_type_key";

-- AlterTable
ALTER TABLE "automation_logs" ADD COLUMN "subjectType" "AutomationSubjectType",
ADD COLUMN "subjectId" TEXT,
ADD COLUMN "leadId" TEXT;

-- Backfill subject from registrationId
UPDATE "automation_logs"
SET "subjectType" = 'REGISTRATION',
    "subjectId" = "registrationId"
WHERE "registrationId" IS NOT NULL;

ALTER TABLE "automation_logs" ALTER COLUMN "subjectType" SET NOT NULL;
ALTER TABLE "automation_logs" ALTER COLUMN "subjectId" SET NOT NULL;

-- DropIndex
DROP INDEX "automation_logs_automationId_registrationId_key";

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_automationId_subjectType_subjectId_key" ON "automation_logs"("automationId", "subjectType", "subjectId");

CREATE INDEX "automation_logs_status_scheduledFor_idx" ON "automation_logs"("status", "scheduledFor");

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing automation config to generic shape
UPDATE "automations"
SET
  "type" = 'WHATSAPP',
  "config" = jsonb_build_object(
    'trigger', 'SCHEDULED',
    'statuses', jsonb_build_array('DRAFT', 'PENDING_PAYMENT'),
    'delayHours', COALESCE((config->>'delayHours')::numeric, 1),
    'delayAnchor', 'ENTITY_CREATED',
    'templateId', COALESCE(config->>'templateId', '532e7a0c-1380-4001-aa2b-94532c2cd750'),
    'batchLimit', COALESCE((config->>'batchLimit')::int, 50),
    'templateVariables', jsonb_build_array('guardianName', 'resumeUrl')
  )
WHERE "type" = 'REGISTRATION_RESUME_WHATSAPP';

-- AlterTable
ALTER TABLE "automations" ALTER COLUMN "type" SET DEFAULT 'WHATSAPP';

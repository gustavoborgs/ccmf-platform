-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "type" "AutomationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" "AutomationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automations_type_key" ON "automations"("type");

-- Seed da automação de retomada de inscrição (config editável no banco).
INSERT INTO "automations" (
    "id",
    "type",
    "name",
    "description",
    "channel",
    "enabled",
    "config",
    "createdAt",
    "updatedAt"
) VALUES (
    'cmautregresume000000000000001',
    'REGISTRATION_RESUME_WHATSAPP',
    'Retomada de inscrição via WhatsApp',
    'Envia link de retomada 1h após inscrição sem pagamento.',
    'WHATSAPP',
    true,
    '{"templateId":"fdb10260-ae1a-4a5e-aa42-647a5070e523","delayHours":1,"batchLimit":50}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "automation_logs" ADD COLUMN "automationId" TEXT;

-- Backfill
UPDATE "automation_logs"
SET "automationId" = 'cmautregresume000000000000001'
WHERE "type" = 'REGISTRATION_RESUME_WHATSAPP';

ALTER TABLE "automation_logs" ALTER COLUMN "automationId" SET NOT NULL;

-- DropIndex
DROP INDEX "automation_logs_type_registrationId_key";

-- DropIndex
DROP INDEX "automation_logs_type_status_createdAt_idx";

-- AlterTable
ALTER TABLE "automation_logs" DROP COLUMN "type",
DROP COLUMN "channel";

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_automationId_registrationId_key" ON "automation_logs"("automationId", "registrationId");

-- CreateIndex
CREATE INDEX "automation_logs_automationId_status_createdAt_idx" ON "automation_logs"("automationId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AutomationType" AS ENUM ('REGISTRATION_RESUME_WHATSAPP');

-- CreateEnum
CREATE TYPE "AutomationChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL,
    "type" "AutomationType" NOT NULL,
    "channel" "AutomationChannel" NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'PENDING',
    "registrationId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "externalBatchId" TEXT,
    "externalJobId" TEXT,
    "payload" JSONB,
    "error" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automation_logs_type_registrationId_key" ON "automation_logs"("type", "registrationId");

-- CreateIndex
CREATE INDEX "automation_logs_type_status_createdAt_idx" ON "automation_logs"("type", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

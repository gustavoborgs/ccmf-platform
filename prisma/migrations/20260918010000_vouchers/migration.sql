-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FREE';

-- CreateEnum
CREATE TYPE "VoucherRedemptionStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'RELEASED');

-- AlterTable: Payment snapshots (backfill originalAmountCents from amountCents)
ALTER TABLE "payments" ADD COLUMN "originalAmountCents" INTEGER;
ALTER TABLE "payments" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "payments" ADD COLUMN "voucherId" TEXT;
ALTER TABLE "payments" ADD COLUMN "voucherCode" TEXT;

UPDATE "payments" SET "originalAmountCents" = "amountCents" WHERE "originalAmountCents" IS NULL;

ALTER TABLE "payments" ALTER COLUMN "originalAmountCents" SET NOT NULL;

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountCents" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_redemptions" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "status" "VoucherRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemptions_paymentId_key" ON "voucher_redemptions"("paymentId");

-- CreateIndex
CREATE INDEX "voucher_redemptions_voucherId_status_idx" ON "voucher_redemptions"("voucherId", "status");

-- CreateIndex
CREATE INDEX "voucher_redemptions_registrationId_idx" ON "voucher_redemptions"("registrationId");

-- CreateIndex
CREATE INDEX "payments_voucherId_idx" ON "payments"("voucherId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardian_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

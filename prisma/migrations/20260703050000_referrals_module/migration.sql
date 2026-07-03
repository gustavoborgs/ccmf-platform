-- Participant referral codes
ALTER TABLE "participants" ADD COLUMN "referralCode" TEXT;

UPDATE "participants"
SET "referralCode" = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 8))
WHERE "referralCode" IS NULL;

ALTER TABLE "participants" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX "participants_referralCode_key" ON "participants"("referralCode");

-- Referral campaigns
CREATE TABLE "referral_campaigns" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rewardLikesCount" INTEGER NOT NULL DEFAULT 50,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_campaigns_contestId_key" ON "referral_campaigns"("contestId");

ALTER TABLE "referral_campaigns" ADD CONSTRAINT "referral_campaigns_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Referrals
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "referrerParticipantId" TEXT NOT NULL,
    "referredRegistrationId" TEXT NOT NULL,
    "rewardGrantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_referredRegistrationId_key" ON "referrals"("referredRegistrationId");

CREATE INDEX "referrals_referrerParticipantId_idx" ON "referrals"("referrerParticipantId");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "referral_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerParticipantId_fkey" FOREIGN KEY ("referrerParticipantId") REFERENCES "participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredRegistrationId_fkey" FOREIGN KEY ("referredRegistrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

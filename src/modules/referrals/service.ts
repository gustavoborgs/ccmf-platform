import type { Prisma } from "@/generated/prisma/client";
import { grantBonusLikes } from "@/modules/participants/service";
import { db } from "@/shared/db";
import { env } from "@/shared/env";
import { REFERRAL_CONFIRMED_STATUSES, REFERRAL_GOAL_COUNT } from "./constants";
import { generateUniqueParticipantReferralCode, normalizeReferralCode } from "./lib/code";
import type { GuardianReferralPanel } from "./types";
import type { ReferralCampaignFormInput } from "./validators";

/**
 * Módulo referrals: indicação por edição, campanhas e prêmio em curtidas.
 * Spec: docs/modules/referrals.md
 */

type DbClient = Prisma.TransactionClient | typeof db;

export function buildReferralShareUrl(referralCode: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/inscricao?indicacao=${encodeURIComponent(referralCode)}`;
}

export async function resolveReferralCode(raw: string, client: DbClient = db) {
  const code = normalizeReferralCode(raw);
  if (!code) return null;

  return client.participant.findUnique({
    where: { referralCode: code },
    select: {
      id: true,
      name: true,
      referralCode: true,
      guardianId: true,
    },
  });
}

function isCampaignActive(
  campaign: {
    enabled: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  },
  now = new Date(),
): boolean {
  if (!campaign.enabled) return false;
  if (campaign.startsAt && now < campaign.startsAt) return false;
  if (campaign.endsAt && now > campaign.endsAt) return false;
  return true;
}

export async function getActiveCampaign(contestId: string, client: DbClient = db) {
  const campaign = await client.referralCampaign.findUnique({
    where: { contestId },
  });
  if (!campaign || !isCampaignActive(campaign)) return null;
  return campaign;
}

export async function validateReferralForRegistration(
  params: {
    code: string;
    contestId: string;
    guardianId: string;
    referredParticipantId?: string;
  },
  client: DbClient = db,
) {
  const { code, contestId, guardianId, referredParticipantId } = params;

  const campaign = await getActiveCampaign(contestId, client);
  if (!campaign) {
    throw new Error("A campanha de indicação não está ativa para esta edição.");
  }

  const referrer = await resolveReferralCode(code, client);
  if (!referrer) {
    throw new Error("Código de indicação não encontrado.");
  }

  if (referrer.guardianId === guardianId) {
    throw new Error("Não é possível usar o código de indicação da sua própria família.");
  }

  if (referredParticipantId && referrer.id === referredParticipantId) {
    throw new Error("Não é possível usar o seu próprio código de indicação.");
  }

  const referrerRegistration = await client.registration.findFirst({
    where: {
      participantId: referrer.id,
      contestId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!referrerRegistration) {
    throw new Error("Este código não é válido para a edição atual.");
  }

  return { campaign, referrer };
}

export async function attachReferralOnRegistration(
  params: {
    registrationId: string;
    code: string;
    contestId: string;
    guardianId: string;
    referredParticipantId: string;
  },
  client: DbClient = db,
) {
  const trimmed = params.code.trim();
  if (!trimmed) return null;

  const { campaign, referrer } = await validateReferralForRegistration(
    {
      code: trimmed,
      contestId: params.contestId,
      guardianId: params.guardianId,
      referredParticipantId: params.referredParticipantId,
    },
    client,
  );

  return client.referral.create({
    data: {
      campaignId: campaign.id,
      referrerParticipantId: referrer.id,
      referredRegistrationId: params.registrationId,
    },
  });
}

/** Concede curtidas ao indicador quando a inscrição indicada é aprovada (idempotente). */
export async function fulfillRewardOnApproval(registrationId: string) {
  const referral = await db.referral.findUnique({
    where: { referredRegistrationId: registrationId },
    include: {
      campaign: true,
      referrerParticipant: { select: { id: true, name: true } },
    },
  });

  if (!referral || referral.rewardGrantedAt) return;

  if (!isCampaignActive(referral.campaign)) {
    console.error(
      `[referrals] Campanha inativa ao conceder prêmio da indicação ${referral.id}.`,
    );
    return;
  }

  const referrerRegistration = await db.registration.findFirst({
    where: {
      participantId: referral.referrerParticipantId,
      contestId: referral.campaign.contestId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!referrerRegistration) {
    console.error(
      `[referrals] Indicador sem inscrição na edição (referral ${referral.id}).`,
    );
    return;
  }

  await grantBonusLikes(
    referrerRegistration.id,
    referral.campaign.rewardLikesCount,
    referral.id,
  );

  await db.referral.update({
    where: { id: referral.id },
    data: { rewardGrantedAt: new Date() },
  });
}

export async function listAdminCampaigns() {
  return db.referralCampaign.findMany({
    include: {
      contest: { select: { year: true, name: true } },
      _count: { select: { referrals: true } },
    },
    orderBy: { contest: { year: "desc" } },
  });
}

export async function upsertCampaign(input: ReferralCampaignFormInput) {
  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;

  return db.referralCampaign.upsert({
    where: { contestId: input.contestId },
    create: {
      contestId: input.contestId,
      name: input.name,
      enabled: input.enabled,
      rewardLikesCount: input.rewardLikesCount,
      startsAt,
      endsAt,
    },
    update: {
      name: input.name,
      enabled: input.enabled,
      rewardLikesCount: input.rewardLikesCount,
      startsAt,
      endsAt,
    },
    include: {
      contest: { select: { year: true, name: true } },
      _count: { select: { referrals: true } },
    },
  });
}

export async function getReferralSummaryForRegistration(registrationId: string) {
  const referral = await db.referral.findUnique({
    where: { referredRegistrationId: registrationId },
    include: {
      referrerParticipant: { select: { id: true, name: true, referralCode: true } },
      campaign: { select: { name: true, rewardLikesCount: true } },
    },
  });

  if (!referral) return null;

  return {
    referrerName: referral.referrerParticipant.name,
    referrerCode: referral.referrerParticipant.referralCode,
    campaignName: referral.campaign.name,
    rewardLikesCount: referral.campaign.rewardLikesCount,
    rewardGranted: referral.rewardGrantedAt !== null,
    rewardGrantedAt: referral.rewardGrantedAt,
  };
}

export async function getReferralStatsForParticipant(participantId: string, contestId: string) {
  const participant = await db.participant.findUnique({
    where: { id: participantId },
    select: { referralCode: true, name: true },
  });
  if (!participant) return null;

  const referrals = await db.referral.findMany({
    where: {
      referrerParticipantId: participantId,
      campaign: { contestId },
    },
    include: {
      referredRegistration: {
        select: {
          id: true,
          protocol: true,
          status: true,
          participant: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    referralCode: participant.referralCode,
    participantName: participant.name,
    shareUrl: buildReferralShareUrl(participant.referralCode),
    referrals: referrals.map((item) => ({
      id: item.id,
      protocol: item.referredRegistration.protocol,
      participantName: item.referredRegistration.participant.name,
      status: item.referredRegistration.status,
      rewardGranted: item.rewardGrantedAt !== null,
      createdAt: item.createdAt,
    })),
    referralsCount: referrals.length,
  };
}

/** Contagem de indicações feitas por participante na edição (batch para listagem admin). */
export async function getReferralsMadeCounts(participantIds: string[], contestId: string) {
  if (participantIds.length === 0) return new Map<string, number>();

  const groups = await db.referral.groupBy({
    by: ["referrerParticipantId"],
    where: {
      referrerParticipantId: { in: participantIds },
      campaign: { contestId },
    },
    _count: { _all: true },
  });

  return new Map(groups.map((group) => [group.referrerParticipantId, group._count._all]));
}

function buildGuardianReferralPanelFromStats(
  stats: NonNullable<Awaited<ReturnType<typeof getReferralStatsForParticipant>>>,
  campaign: Awaited<ReturnType<typeof getActiveCampaign>>,
): GuardianReferralPanel {
  const confirmedCount = stats.referrals.filter((referral) =>
    REFERRAL_CONFIRMED_STATUSES.includes(
      referral.status as (typeof REFERRAL_CONFIRMED_STATUSES)[number],
    ),
  ).length;

  return {
    participantName: stats.participantName,
    referralCode: stats.referralCode,
    shareUrl: stats.shareUrl,
    confirmedCount,
    pendingCount: stats.referralsCount - confirmedCount,
    goalCount: REFERRAL_GOAL_COUNT,
    rewardLikesCount: campaign?.rewardLikesCount ?? 50,
    campaignActive: Boolean(campaign),
  };
}

/** Painel de indicação para o responsável — só inscrições aprovadas/publicadas. */
export async function getGuardianReferralPanel(params: {
  guardianId: string;
  registrationId: string;
}): Promise<GuardianReferralPanel | null> {
  const registration = await db.registration.findFirst({
    where: {
      id: params.registrationId,
      deletedAt: null,
      status: { in: [...REFERRAL_CONFIRMED_STATUSES] },
      participant: { guardianId: params.guardianId },
    },
    select: {
      id: true,
      participantId: true,
      contestId: true,
    },
  });

  if (!registration) return null;

  const [stats, campaign] = await Promise.all([
    getReferralStatsForParticipant(registration.participantId, registration.contestId),
    getActiveCampaign(registration.contestId),
  ]);

  if (!stats) return null;

  return buildGuardianReferralPanelFromStats(stats, campaign);
}

/** Batch para a página `/conta` — evita N+1. */
export async function listGuardianReferralPanels(
  guardianId: string,
  registrationIds: string[],
): Promise<Map<string, GuardianReferralPanel>> {
  if (registrationIds.length === 0) return new Map();

  const registrations = await db.registration.findMany({
    where: {
      id: { in: registrationIds },
      deletedAt: null,
      status: { in: [...REFERRAL_CONFIRMED_STATUSES] },
      participant: { guardianId },
    },
    select: {
      id: true,
      participantId: true,
      contestId: true,
    },
  });

  if (registrations.length === 0) return new Map();

  const participantIds = [...new Set(registrations.map((r) => r.participantId))];
  const contestIds = [...new Set(registrations.map((r) => r.contestId))];

  const [participants, referrals, campaigns] = await Promise.all([
    db.participant.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, referralCode: true, name: true },
    }),
    db.referral.findMany({
      where: {
        referrerParticipantId: { in: participantIds },
        campaign: { contestId: { in: contestIds } },
      },
      include: {
        referredRegistration: { select: { status: true } },
        campaign: { select: { contestId: true, rewardLikesCount: true, enabled: true, startsAt: true, endsAt: true } },
      },
    }),
    db.referralCampaign.findMany({
      where: { contestId: { in: contestIds } },
    }),
  ]);

  const participantById = new Map(participants.map((p) => [p.id, p]));
  const campaignByContestId = new Map(campaigns.map((c) => [c.contestId, c]));

  const referralsByKey = new Map<string, typeof referrals>();
  for (const referral of referrals) {
    const key = `${referral.referrerParticipantId}:${referral.campaign.contestId}`;
    const list = referralsByKey.get(key) ?? [];
    list.push(referral);
    referralsByKey.set(key, list);
  }

  const panels = new Map<string, GuardianReferralPanel>();

  for (const registration of registrations) {
    const participant = participantById.get(registration.participantId);
    if (!participant) continue;

    const key = `${registration.participantId}:${registration.contestId}`;
    const participantReferrals = referralsByKey.get(key) ?? [];

    const confirmedCount = participantReferrals.filter((referral) =>
      REFERRAL_CONFIRMED_STATUSES.includes(
        referral.referredRegistration.status as (typeof REFERRAL_CONFIRMED_STATUSES)[number],
      ),
    ).length;

    const rawCampaign = campaignByContestId.get(registration.contestId);
    const campaign = rawCampaign && isCampaignActive(rawCampaign) ? rawCampaign : null;

    panels.set(registration.id, {
      participantName: participant.name,
      referralCode: participant.referralCode,
      shareUrl: buildReferralShareUrl(participant.referralCode),
      confirmedCount,
      pendingCount: participantReferrals.length - confirmedCount,
      goalCount: REFERRAL_GOAL_COUNT,
      rewardLikesCount: campaign?.rewardLikesCount ?? rawCampaign?.rewardLikesCount ?? 50,
      campaignActive: Boolean(campaign),
    });
  }

  return panels;
}

export { generateUniqueParticipantReferralCode };

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { handleRegistrationApprovedSideEffects } from "@/modules/registrations/service";
import {
  getReferralStatsForParticipant,
  getReferralsMadeCounts,
} from "@/modules/referrals/service";
import type { ReferralStats } from "@/modules/referrals/types";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { PUBLIC_CONTEST_STATUSES } from "@/modules/contests/validators";
import type {
  AdminParticipantFilters,
  AdminRegistrationStatus,
  PublicGalleryFilters,
} from "./validators";

/**
 * Módulo Participants: página pública do participante, likes e compartilhamento.
 * Spec: docs/modules/participants.md
 */

/** Status visíveis publicamente — nunca expor inscrições fora desta lista. */
const PUBLIC_STATUSES = ["APPROVED", "SEMIFINALIST", "WINNER"] as const;

/** Anos de edições ativas com participantes públicos (mais recente primeiro). */
export async function listPublicYears(): Promise<number[]> {
  const contests = await db.contest.findMany({
    where: {
      status: { in: [...PUBLIC_CONTEST_STATUSES] },
      registrations: { some: { status: { in: [...PUBLIC_STATUSES] } } },
    },
    select: { year: true },
    orderBy: { year: "desc" },
  });
  return contests.map((contest) => contest.year);
}

/** Listagem pública: inscrições visíveis do ano. */
export async function listPublicParticipants(year: number, filters: Partial<PublicGalleryFilters> = {}) {
  const contest = await db.contest.findFirst({
    where: { year, status: { in: [...PUBLIC_CONTEST_STATUSES] } },
    select: { id: true },
  });
  if (!contest) return [];

  return db.registration.findMany({
    where: {
      contest: { year, status: { in: [...PUBLIC_CONTEST_STATUSES] } },
      status: { in: [...PUBLIC_STATUSES] },
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.q
        ? { participant: { name: { contains: filters.q, mode: "insensitive" } } }
        : {}),
    },
    include: {
      participant: true,
      category: true,
      photos: { where: { isCover: true }, take: 1 },
    },
    orderBy: [{ likesCount: "desc" }, { createdAt: "asc" }],
  });
}

export function getPublicParticipant(year: number, slug: string) {
  return db.registration.findFirst({
    where: {
      contest: { year, status: { in: [...PUBLIC_CONTEST_STATUSES] } },
      participant: { slug },
      status: { in: [...PUBLIC_STATUSES] },
    },
    include: {
      participant: true,
      category: true,
      contest: true,
      photos: { orderBy: [{ isCover: "desc" }, { order: "asc" }] },
    },
  });
}

/** Entradas leves para o sitemap: galerias por ano + perfis públicos aprovados. */
export async function listPublicSitemapEntries(): Promise<{
  years: { year: number; updatedAt: Date }[];
  profiles: { year: number; slug: string; updatedAt: Date }[];
}> {
  const PUBLIC_STATUSES_LIST = [...PUBLIC_STATUSES];
  const contests = await db.contest.findMany({
    where: {
      status: { in: [...PUBLIC_CONTEST_STATUSES] },
      registrations: { some: { status: { in: PUBLIC_STATUSES_LIST } } },
    },
    select: {
      year: true,
      updatedAt: true,
      registrations: {
        where: { status: { in: PUBLIC_STATUSES_LIST } },
        select: {
          updatedAt: true,
          participant: { select: { slug: true } },
        },
      },
    },
    orderBy: { year: "desc" },
  });

  return {
    years: contests.map((contest) => ({ year: contest.year, updatedAt: contest.updatedAt })),
    profiles: contests.flatMap((contest) =>
      contest.registrations.map((registration) => ({
        year: contest.year,
        slug: registration.participant.slug,
        updatedAt: registration.updatedAt,
      })),
    ),
  };
}

/** Fingerprint anônimo para deduplicar likes sem exigir login. */
export function buildLikeFingerprint(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");
}

/** Registra like único por visitante; retorna o total atualizado. */
export async function likeRegistration(registrationId: string, fingerprint: string) {
  const existing = await db.like.findUnique({
    where: { registrationId_fingerprint: { registrationId, fingerprint } },
  });
  if (existing) {
    const current = await db.registration.findUniqueOrThrow({
      where: { id: registrationId },
      select: { likesCount: true },
    });
    return { liked: false, likesCount: current.likesCount };
  }

  // Incremento via SQL para não disparar @updatedAt (listagem admin ordena por updatedAt).
  const updated = await db.$transaction(async (tx) => {
    await tx.like.create({ data: { registrationId, fingerprint } });
    const [row] = await tx.$queryRaw<{ likesCount: number }[]>`
      UPDATE registrations
      SET "likesCount" = "likesCount" + 1
      WHERE id = ${registrationId}
      RETURNING "likesCount"
    `;
    if (!row) throw new Error("Inscrição não encontrada.");
    return row;
  });
  return { liked: true, likesCount: updated.likesCount };
}

/**
 * Credita curtidas bônus (ex.: prêmio de indicação) com fingerprints sintéticos.
 * Idempotência é responsabilidade do chamador (ex.: referrals.fulfillRewardOnApproval).
 */
export async function grantBonusLikes(
  registrationId: string,
  count: number,
  sourceId: string,
) {
  if (count <= 0) return { likesCount: 0 };

  const updated = await db.$transaction(async (tx) => {
    for (let index = 0; index < count; index += 1) {
      const fingerprint = `referral-bonus:${sourceId}:${index}`;
      const existing = await tx.like.findUnique({
        where: { registrationId_fingerprint: { registrationId, fingerprint } },
      });
      if (!existing) {
        await tx.like.create({ data: { registrationId, fingerprint } });
      }
    }

    const [row] = await tx.$queryRaw<{ likesCount: number }[]>`
      UPDATE registrations
      SET "likesCount" = (
        SELECT COUNT(*)::int FROM likes WHERE "registrationId" = ${registrationId}
      )
      WHERE id = ${registrationId}
      RETURNING "likesCount"
    `;
    if (!row) throw new Error("Inscrição não encontrada.");
    return row;
  });

  return { likesCount: updated.likesCount };
}

const adminParticipantRegistrationInclude = {
  participant: {
    include: {
      guardian: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  },
  contest: true,
  category: true,
  photos: { orderBy: { order: "asc" as const } },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
  referral: {
    include: {
      referrerParticipant: { select: { id: true, name: true, referralCode: true } },
      campaign: { select: { name: true, rewardLikesCount: true } },
    },
  },
  _count: { select: { photos: true, likes: true, votes: true } },
} satisfies Prisma.RegistrationInclude;

export type AdminParticipantRegistration = Prisma.RegistrationGetPayload<{
  include: typeof adminParticipantRegistrationInclude;
}>;

export type AdminParticipantListItem = AdminParticipantRegistration & {
  referralsMadeCount: number;
  referralStats: ReferralStats | null;
};

/** Listagem administrativa: uma linha por inscrição de participante. */
export async function listAdminParticipants(filters: AdminParticipantFilters) {
  const where = buildAdminParticipantWhere(filters);
  const total = await db.registration.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.registration.findMany({
    where,
    include: adminParticipantRegistrationInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: filters.pageSize,
  });

  const byContest = new Map<string, string[]>();
  for (const item of items) {
    const ids = byContest.get(item.contestId) ?? [];
    ids.push(item.participantId);
    byContest.set(item.contestId, ids);
  }

  const countMaps = new Map<string, Map<string, number>>();
  await Promise.all(
    [...byContest.entries()].map(async ([contestId, participantIds]) => {
      countMaps.set(contestId, await getReferralsMadeCounts(participantIds, contestId));
    }),
  );

  const enriched: AdminParticipantListItem[] = await Promise.all(
    items.map(async (registration) => ({
      ...registration,
      referralsMadeCount:
        countMaps.get(registration.contestId)?.get(registration.participantId) ?? 0,
      referralStats: await getReferralStatsForParticipant(
        registration.participantId,
        registration.contestId,
      ),
    })),
  );

  return { items: enriched, pagination };
}

/** Detalhe administrativo de uma inscrição de participante. */
export async function getAdminParticipantRegistration(registrationId: string) {
  return db.registration.findUnique({
    where: { id: registrationId },
    include: adminParticipantRegistrationInclude,
  });
}

/** Alteração administrativa livre do status da inscrição. */
export async function updateAdminParticipantStatus(
  registrationId: string,
  status: AdminRegistrationStatus,
) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      approvedAt: true,
      participant: { select: { slug: true } },
      contest: { select: { year: true } },
    },
  });
  if (!registration) throw new Error("Inscrição não encontrada.");

  const previousStatus = registration.status;
  const isPublicStatus = PUBLIC_STATUSES.includes(status as (typeof PUBLIC_STATUSES)[number]);

  const updated = await db.registration.update({
    where: { id: registration.id },
    data: {
      status,
      approvedAt: isPublicStatus ? (registration.approvedAt ?? new Date()) : null,
      rejectionReason: status === "REJECTED" ? undefined : null,
    },
    select: {
      id: true,
      status: true,
      participant: { select: { slug: true } },
      contest: { select: { year: true } },
    },
  });

  if (status === "APPROVED" && previousStatus !== "APPROVED") {
    await handleRegistrationApprovedSideEffects(registrationId);
  }

  return updated;
}

function buildAdminParticipantWhere(filters: AdminParticipantFilters): Prisma.RegistrationWhereInput {
  const where: Prisma.RegistrationWhereInput = {};

  if (filters.year) where.contest = { year: filters.year };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;

  if (filters.q) {
    where.OR = [
      { protocol: { contains: filters.q, mode: "insensitive" } },
      { participant: { name: { contains: filters.q, mode: "insensitive" } } },
      {
        participant: {
          guardian: {
            user: {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { email: { contains: filters.q, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ];
  }

  return where;
}

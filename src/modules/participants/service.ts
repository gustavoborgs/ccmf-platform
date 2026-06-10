import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import type { AdminParticipantFilters, PublicGalleryFilters } from "./validators";

/**
 * Módulo Participants: página pública do participante, likes e compartilhamento.
 * Spec: docs/modules/participants.md
 */

/** Status visíveis publicamente — nunca expor inscrições fora desta lista. */
const PUBLIC_STATUSES = ["APPROVED", "SEMIFINALIST", "WINNER"] as const;

/** Anos de edições com participantes públicos (mais recente primeiro). */
export async function listPublicYears(): Promise<number[]> {
  const contests = await db.contest.findMany({
    where: { registrations: { some: { status: { in: [...PUBLIC_STATUSES] } } } },
    select: { year: true },
    orderBy: { year: "desc" },
  });
  return contests.map((contest) => contest.year);
}

/** Listagem pública: apenas inscrições aprovadas do ano selecionado. */
export function listPublicParticipants(year: number, filters: Partial<PublicGalleryFilters> = {}) {
  return db.registration.findMany({
    where: {
      contest: { year },
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
      contest: { year },
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

  const [, updated] = await db.$transaction([
    db.like.create({ data: { registrationId, fingerprint } }),
    db.registration.update({
      where: { id: registrationId },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    }),
  ]);
  return { liked: true, likesCount: updated.likesCount };
}

/** Listagem administrativa: uma linha por inscrição de participante. */
export async function listAdminParticipants(filters: AdminParticipantFilters) {
  const where = buildAdminParticipantWhere(filters);
  const total = await db.registration.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.registration.findMany({
    where,
    include: {
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
      photos: { orderBy: { order: "asc" } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { photos: true, likes: true, votes: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take: filters.pageSize,
  });

  return { items, pagination };
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

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
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
  _count: { select: { photos: true, likes: true, votes: true } },
} satisfies Prisma.RegistrationInclude;

export type AdminParticipantRegistration = Prisma.RegistrationGetPayload<{
  include: typeof adminParticipantRegistrationInclude;
}>;

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

  return { items, pagination };
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
      approvedAt: true,
      participant: { select: { slug: true } },
      contest: { select: { year: true } },
    },
  });
  if (!registration) throw new Error("Inscrição não encontrada.");

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

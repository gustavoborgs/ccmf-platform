import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { getActiveContest } from "@/modules/contests/service";
import { buildProtocol, slugify } from "@/shared/utils";
import { findCategoryForBirthDate } from "@/modules/contests/service";
import type {
  AdminRegistrationFilters,
  GuardianStep1Input,
  ParticipantInput,
} from "./validators";
import { convertLead } from "@/modules/leads/service";

import { parseWizardRef } from "./wizard-ref";

/**
 * Módulo Registrations: wizard de inscrição + ciclo de vida da inscrição.
 * Spec: docs/modules/registrations.md
 *
 * Fluxo: DRAFT -> PENDING_PAYMENT -> PAID -> UNDER_REVIEW -> APPROVED/REJECTED
 *        APPROVED -> SEMIFINALIST -> WINNER (fase de julgamento)
 */

// ─────────────────────────────────────────────
// Step 1 — Responsável (CPF-first)
// ─────────────────────────────────────────────

/**
 * Verifica se o CPF já está cadastrado. A action que expõe isso NUNCA deve
 * retornar dados do responsável — apenas o boolean (privacidade).
 */
export async function checkCpfExists(cpf: string): Promise<boolean> {
  const profile = await db.guardianProfile.findUnique({
    where: { cpf },
    select: { id: true },
  });
  return Boolean(profile);
}

export type EnsureGuardianResult = {
  guardianId: string;
  userId: string;
  /** true = CPF já existia e a inscrição foi apenas vinculada (sem autenticar) */
  linked: boolean;
};

/**
 * CPF existente → vincula sem autenticar e sem ler/sobrescrever dados do
 * cadastro. Retorna null se o CPF não existe (frontend deve pedir cadastro).
 */
export async function linkGuardianByCpf(cpf: string): Promise<EnsureGuardianResult | null> {
  const existing = await db.guardianProfile.findUnique({
    where: { cpf },
    select: { id: true, userId: true },
  });
  if (!existing) return null;
  return { guardianId: existing.id, userId: existing.userId, linked: true };
}

/** Guardian do usuário autenticado (responsável logado pula o step 1). */
export async function getGuardianByUserId(userId: string) {
  return db.guardianProfile.findUnique({ where: { userId }, select: { id: true } });
}

/**
 * Step 1 do wizard:
 * - CPF existente → vincula a inscrição ao responsável existente, sem
 *   autenticar e sem sobrescrever nenhum dado cadastral (login fica para
 *   um segundo momento, via senha ou recuperação).
 * - CPF novo → exige senha e cria User + GuardianProfile.
 */
export async function ensureGuardian(input: GuardianStep1Input): Promise<EnsureGuardianResult> {
  const email = input.email.toLowerCase();

  const existing = await db.guardianProfile.findUnique({
    where: { cpf: input.cpf },
    select: { id: true, userId: true },
  });
  if (existing) {
    return { guardianId: existing.id, userId: existing.userId, linked: true };
  }

  if (!input.password) {
    throw new Error("Crie uma senha para concluir seu cadastro.");
  }

  const emailTaken = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (emailTaken) {
    throw new Error("Este e-mail já possui conta. Entre com sua senha em /entrar.");
  }

  const user = await db.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 10),
      role: "GUARDIAN",
      guardianProfile: {
        create: {
          cpf: input.cpf,
          whatsapp: input.phone,
          zipCode: input.zipCode,
          street: input.street,
          number: input.number,
          complement: input.complement || null,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
        },
      },
    },
    include: { guardianProfile: { select: { id: true } } },
  });

  await convertLead({ email, cpf: input.cpf, guardianUserId: user.id });

  return { guardianId: user.guardianProfile!.id, userId: user.id, linked: false };
}

export async function createRegistration(params: {
  guardianId: string;
  contestId: string;
  participant: ParticipantInput;
}) {
  const { guardianId, contestId, participant } = params;

  const category = await findCategoryForBirthDate(contestId, participant.birthDate);
  if (!category) {
    throw new Error("Nenhuma categoria disponível para a idade informada.");
  }

  const contest = await db.contest.findUniqueOrThrow({ where: { id: contestId } });

  return db.$transaction(async (tx) => {
    const created = await tx.participant.create({
      data: {
        guardianId,
        name: participant.name,
        slug: await uniqueSlug(participant.name),
        birthDate: participant.birthDate,
        gender: participant.gender ?? null,
        city: participant.city,
        state: participant.state,
        imageConsentAt: new Date(),
      },
    });

    const sequence = (await tx.registration.count({ where: { contestId } })) + 1;

    return tx.registration.create({
      data: {
        participantId: created.id,
        contestId,
        categoryId: category.id,
        status: "DRAFT",
        protocol: buildProtocol(contest.year, sequence),
      },
      include: { participant: true, category: true },
    });
  });
}

export async function updateRegistrationParticipant(params: {
  guardianId: string;
  registrationId: string;
  participant: ParticipantInput;
}) {
  const { guardianId, registrationId, participant } = params;

  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      contestId: true,
      participantId: true,
      participant: { select: { guardianId: true, slug: true } },
    },
  });
  if (!registration || registration.participant.guardianId !== guardianId) {
    throw new Error("Inscrição não encontrada.");
  }
  if (registration.status !== "DRAFT") {
    throw new Error("Não é possível alterar os dados depois de iniciar o pagamento.");
  }

  const category = await findCategoryForBirthDate(registration.contestId, participant.birthDate);
  if (!category) {
    throw new Error("Nenhuma categoria disponível para a idade informada.");
  }

  return db.$transaction(async (tx) => {
    await tx.participant.update({
      where: { id: registration.participantId },
      data: {
        name: participant.name,
        slug:
          registration.participant.slug === slugify(participant.name)
            ? registration.participant.slug
            : await uniqueSlug(participant.name),
        birthDate: participant.birthDate,
        gender: participant.gender,
        city: participant.city,
        state: participant.state,
        imageConsentAt: new Date(),
      },
    });

    return tx.registration.update({
      where: { id: registration.id },
      data: { categoryId: category.id },
      include: { participant: true, category: true },
    });
  });
}

export type WizardStep = "PARTICIPANT" | "PHOTOS" | "CHECKOUT" | "PAYMENT_PENDING";

/**
 * Retoma uma inscrição abandonada: diz em qual step do wizard o responsável
 * parou na edição informada (derivado dos dados, sem estado extra).
 */
export async function resumeEnrollment(guardianId: string, contestId: string) {
  const registration = await db.registration.findFirst({
    where: {
      contestId,
      participant: { guardianId },
      status: { in: ["DRAFT", "PENDING_PAYMENT"] },
    },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!registration) {
    return { step: "PARTICIPANT" as WizardStep, registrationId: null, photosCount: 0 };
  }

  const step: WizardStep =
    registration.status === "PENDING_PAYMENT"
      ? "PAYMENT_PENDING"
      : registration._count.photos < 2
        ? "PHOTOS"
        : "CHECKOUT";

  return { step, registrationId: registration.id, photosCount: registration._count.photos };
}

// ─────────────────────────────────────────────
// Link de retomada (/inscricao/retomar/[id])
// ─────────────────────────────────────────────

export type ResumeLinkResult =
  /** abandonou antes de criar a conta → volta ao step 1 com prefill */
  | {
      kind: "PRE_ACCOUNT";
      leadId: string;
      prefill: { name: string | null; email: string | null; phone: string | null };
    }
  /** inscrição em andamento → step recalculado na hora */
  | {
      kind: "WIZARD";
      step: WizardStep;
      registrationId: string;
      guardianId: string;
      photosCount: number;
    }
  /** já pagou → só status, sem CTA de recuperação */
  | { kind: "COMPLETED"; registrationId: string; protocol: string }
  | null;

/**
 * Resolve o link permanente de retomada. Aceita:
 * - cuid de Lead (pré-conta) ou de Registration
 * - protocolo completo: `CCMF-2026-000001`
 * - número curto do protocolo: `000001` ou `1` (edição ativa)
 */
export async function resolveResumeLink(publicId: string): Promise<ResumeLinkResult> {
  const lead = await db.lead.findUnique({ where: { id: publicId } });
  if (lead) {
    if (lead.stage !== "NEW") return null;
    return {
      kind: "PRE_ACCOUNT",
      leadId: lead.id,
      prefill: { name: lead.name, email: lead.email, phone: lead.phone },
    };
  }

  const registration = await findRegistrationForResume(publicId);
  if (!registration) return null;

  if (registration.status === "DRAFT") {
    return {
      kind: "WIZARD",
      step: registration._count.photos < 2 ? "PHOTOS" : "CHECKOUT",
      registrationId: registration.id,
      guardianId: registration.participant.guardianId,
      photosCount: registration._count.photos,
    };
  }
  if (registration.status === "PENDING_PAYMENT") {
    return {
      kind: "WIZARD",
      step: "PAYMENT_PENDING",
      registrationId: registration.id,
      guardianId: registration.participant.guardianId,
      photosCount: registration._count.photos,
    };
  }
  return { kind: "COMPLETED", registrationId: registration.id, protocol: registration.protocol };
}

const registrationResumeInclude = {
  participant: { select: { guardianId: true } },
  _count: { select: { photos: true } },
} as const;

async function findRegistrationForResume(publicId: string) {
  const trimmed = publicId.trim();

  // cuid da inscrição
  const byId = await db.registration.findUnique({
    where: { id: trimmed },
    include: registrationResumeInclude,
  });
  if (byId) return byId;

  // protocolo completo CCMF-2026-000001
  const protocolMatch = /^CCMF-(\d{4})-(\d{1,6})$/i.exec(trimmed);
  if (protocolMatch) {
    const protocol = buildProtocol(Number(protocolMatch[1]), Number(protocolMatch[2]));
    return db.registration.findUnique({ where: { protocol }, include: registrationResumeInclude });
  }

  // número curto: 000001 ou 1 → protocolo da edição ativa
  if (/^\d{1,6}$/.test(trimmed)) {
    const contest = await getActiveContest();
    if (!contest) return null;
    const protocol = buildProtocol(contest.year, Number(trimmed));
    return db.registration.findUnique({ where: { protocol }, include: registrationResumeInclude });
  }

  return null;
}

// ─────────────────────────────────────────────
// Funil de vendas (derivado — fonte p/ o CRM)
// ─────────────────────────────────────────────

export type EnrollmentFunnelStep =
  | "PENDING_PHOTOS" // DRAFT com menos de 2 fotos
  | "READY_FOR_CHECKOUT" // DRAFT com 2 fotos, sem cobrança
  | "PAYMENT_PENDING" // checkout criado, aguardando webhook
  | "PAYMENT_CONFIRMED"; // PAID em diante

const FUNNEL_BY_STATUS: Partial<Record<string, EnrollmentFunnelStep>> = {
  PENDING_PAYMENT: "PAYMENT_PENDING",
  PAID: "PAYMENT_CONFIRMED",
  UNDER_REVIEW: "PAYMENT_CONFIRMED",
  APPROVED: "PAYMENT_CONFIRMED",
  SEMIFINALIST: "PAYMENT_CONFIRMED",
  WINNER: "PAYMENT_CONFIRMED",
};

/**
 * Funil derivado 100% de Registration — nenhuma etapa é persistida.
 * Consumido pelo board do CRM (módulo leads) e pelo dashboard admin.
 */
export async function getEnrollmentFunnel(contestId: string) {
  const registrations = await db.registration.findMany({
    where: { contestId, status: { not: "REJECTED" } },
    include: {
      participant: {
        include: { guardian: { include: { user: { select: { name: true, email: true, phone: true } } } } },
      },
      _count: { select: { photos: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return registrations.map((registration) => {
    const step: EnrollmentFunnelStep =
      FUNNEL_BY_STATUS[registration.status] ??
      (registration._count.photos < 2 ? "PENDING_PHOTOS" : "READY_FOR_CHECKOUT");

    return {
      step,
      registrationId: registration.id,
      protocol: registration.protocol,
      participantName: registration.participant.name,
      guardian: registration.participant.guardian.user,
      photosCount: registration._count.photos,
      updatedAt: registration.updatedAt,
    };
  });
}

/** Dados mínimos da inscrição para o wizard renderizar o estado atual. */
export function getWizardRegistration(registrationId: string) {
  return db.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      status: true,
      protocol: true,
      participant: {
        select: {
          name: true,
          birthDate: true,
          gender: true,
          city: true,
          state: true,
          guardianId: true,
        },
      },
      category: { select: { name: true } },
      _count: { select: { photos: true } },
    },
  });
}

export type WizardRefState = {
  guardianId: string;
  registration: NonNullable<Awaited<ReturnType<typeof getWizardRegistration>>> | null;
};

/**
 * Deriva o estado do wizard a partir do ref assinado da URL.
 * Valida assinatura, existência do guardian e posse da inscrição.
 * Ref ausente/inválido → null (o wizard começa do início).
 */
export async function getWizardStateFromRef(
  rawRef: string | null | undefined,
): Promise<WizardRefState | null> {
  const ref = parseWizardRef(rawRef);
  if (!ref) return null;

  const guardian = await db.guardianProfile.findUnique({
    where: { id: ref.guardianId },
    select: { id: true },
  });
  if (!guardian) return null;

  if (!ref.registrationId) return { guardianId: guardian.id, registration: null };

  const registration = await getWizardRegistration(ref.registrationId);
  if (!registration || registration.participant.guardianId !== guardian.id) {
    return { guardianId: guardian.id, registration: null };
  }

  return { guardianId: guardian.id, registration };
}

export function listGuardianRegistrations(guardianId: string) {
  return db.registration.findMany({
    where: { participant: { guardianId } },
    include: {
      participant: true,
      category: true,
      contest: true,
      photos: { orderBy: { order: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────
// Revisão administrativa
// ─────────────────────────────────────────────

const REVIEWABLE_STATUSES = ["PAID", "UNDER_REVIEW"] as const;

/** Inscrição com pagamento confirmado entra na fila de conferência operacional do admin. */
export async function sendRegistrationToReview(registrationId: string) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true },
  });
  if (!registration) throw new Error("Inscrição não encontrada.");
  if (!["PENDING_PAYMENT", "PAID"].includes(registration.status)) return registration;

  return db.registration.update({
    where: { id: registrationId },
    data: { status: "UNDER_REVIEW" },
  });
}

/** Aprova e publica a inscrição na galeria pública. */
export async function approveRegistration(registrationId: string) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true, _count: { select: { photos: true } } },
  });
  if (!registration) throw new Error("Inscrição não encontrada.");
  if (!REVIEWABLE_STATUSES.includes(registration.status as (typeof REVIEWABLE_STATUSES)[number])) {
    throw new Error("Apenas inscrições pagas/em análise podem ser aprovadas.");
  }
  if (registration._count.photos < 2) {
    throw new Error("A inscrição precisa ter 2 fotos antes da aprovação.");
  }

  return db.registration.update({
    where: { id: registrationId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });
}

/** Rejeita a inscrição após análise administrativa. */
export async function rejectRegistration(registrationId: string, rejectionReason: string) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true },
  });
  if (!registration) throw new Error("Inscrição não encontrada.");
  if (!REVIEWABLE_STATUSES.includes(registration.status as (typeof REVIEWABLE_STATUSES)[number])) {
    throw new Error("Apenas inscrições pagas/em análise podem ser recusadas.");
  }

  return db.registration.update({
    where: { id: registrationId },
    data: {
      status: "REJECTED",
      approvedAt: null,
      rejectionReason,
    },
  });
}

/** Listagem administrativa: fila de inscrições paginada e filtrável. */
export async function listAdminRegistrations(filters: AdminRegistrationFilters) {
  const where = buildAdminRegistrationWhere(filters);
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
      category: true,
      contest: true,
      photos: { orderBy: { order: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      _count: { select: { photos: true } },
    },
    orderBy: { updatedAt: "desc" },
    skip,
    take: filters.pageSize,
  });

  return { items, pagination };
}

function buildAdminRegistrationWhere(
  filters: AdminRegistrationFilters,
): Prisma.RegistrationWhereInput {
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

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const count = await db.participant.count({ where: { slug: { startsWith: base } } });
  return count === 0 ? base : `${base}-${count + 1}`;
}

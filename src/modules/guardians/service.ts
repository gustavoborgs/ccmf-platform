import bcrypt from "bcryptjs";
import type { Prisma, RegistrationStatus } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import type { AdminGuardianFilters, AdminGuardianUpdateInput } from "./validators";

/**
 * Módulo Guardians: visão administrativa dos responsáveis.
 * Spec: docs/modules/guardians.md
 */

const PAID_REGISTRATION_STATUSES: RegistrationStatus[] = [
  "PAID",
  "UNDER_REVIEW",
  "APPROVED",
  "SEMIFINALIST",
  "WINNER",
];

type AdminGuardianParticipantRegistration = {
  id: string;
  protocol: string;
  status: RegistrationStatus;
  contest: { year: number };
  category: { name: string };
};

type AdminGuardianParticipant = {
  id: string;
  name: string;
  city: string;
  state: string;
  registrations: AdminGuardianParticipantRegistration[];
  paidRegistrationsCount: number;
  _count: { registrations: number };
};

type AdminGuardianRecord = {
  id: string;
  cpf: string | null;
  whatsapp: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  asaasCustomerId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
  };
  participants: AdminGuardianParticipant[];
  _count: { participants: number };
};

export type AdminGuardianListItem = AdminGuardianRecord & {
  paidRegistrationsCount: number;
};

export async function listAdminGuardians(filters: AdminGuardianFilters) {
  const where = buildGuardianWhere(filters.q);
  const total = await db.guardianProfile.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const guardianRows = await db.guardianProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      participants: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          registrations: {
            select: {
              id: true,
              protocol: true,
              status: true,
              contest: { select: { year: true } },
              category: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { registrations: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { participants: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
    skip,
    take: filters.pageSize,
  });
  const guardians = guardianRows as unknown as AdminGuardianRecord[];

  return {
    items: guardians.map((guardian) => ({
      ...guardian,
      participants: guardian.participants.map((participant) => ({
        ...participant,
        paidRegistrationsCount: participant.registrations.filter((registration) =>
          PAID_REGISTRATION_STATUSES.includes(registration.status),
        ).length,
      })),
      paidRegistrationsCount: guardian.participants.reduce(
        (sum, participant) =>
          sum +
          participant.registrations.filter((registration) =>
            PAID_REGISTRATION_STATUSES.includes(registration.status),
          ).length,
        0,
      ),
    })),
    pagination,
  };
}

export async function updateAdminGuardian(
  guardianId: string,
  input: AdminGuardianUpdateInput,
): Promise<void> {
  const guardian = await db.guardianProfile.findUnique({
    where: { id: guardianId },
    select: { id: true, userId: true },
  });
  if (!guardian) throw new Error("Responsável não encontrado.");

  const emailOwner = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== guardian.userId) {
    throw new Error("Este e-mail já está em uso por outro usuário.");
  }

  if (input.cpf) {
    const cpfOwner = await db.guardianProfile.findUnique({
      where: { cpf: input.cpf },
      select: { id: true },
    });
    if (cpfOwner && cpfOwner.id !== guardian.id) {
      throw new Error("Este CPF já está em uso por outro responsável.");
    }
  }

  const userData: Prisma.UserUpdateInput = {
    name: input.name,
    email: input.email,
    phone: input.phone,
  };

  if (input.newPassword) {
    userData.passwordHash = await bcrypt.hash(input.newPassword, 10);
    userData.requiresPasswordSetup = false;
  }

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: guardian.userId },
      data: userData,
    });

    await tx.guardianProfile.update({
      where: { id: guardian.id },
      data: {
        cpf: input.cpf,
        whatsapp: input.whatsapp,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
      },
    });

    if (input.newPassword) {
      await tx.passwordResetToken.updateMany({
        where: { userId: guardian.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    }
  });
}

function buildGuardianWhere(query: string | undefined): Prisma.GuardianProfileWhereInput {
  if (!query) return {};

  const digits = query.replace(/\D/g, "");
  const or: Prisma.GuardianProfileWhereInput[] = [
    { user: { name: { contains: query, mode: "insensitive" } } },
    { user: { email: { contains: query, mode: "insensitive" } } },
  ];

  if (digits) {
    or.push(
      { cpf: { contains: digits } },
      { whatsapp: { contains: digits } },
      { user: { phone: { contains: digits } } },
    );
  }

  return { OR: or };
}

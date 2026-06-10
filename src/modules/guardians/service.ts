import type { Prisma, RegistrationStatus } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import type { AdminGuardianFilters } from "./validators";

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

type AdminGuardianParticipant = {
  id: string;
  name: string;
  city: string;
  state: string;
  registrations: { id: string }[];
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
            where: { status: { in: PAID_REGISTRATION_STATUSES } },
            select: { id: true },
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
      paidRegistrationsCount: guardian.participants.reduce(
        (sum, participant) => sum + participant.registrations.length,
        0,
      ),
    })),
    pagination,
  };
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

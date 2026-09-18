import type { Prisma, VoucherRedemptionStatus } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import {
  normalizeVoucherCode,
  type AdminVoucherFilters,
  type VoucherFormInput,
} from "./validators";

/**
 * Módulo Vouchers: cupons de desconto fixo no checkout.
 * Spec: docs/modules/vouchers.md
 */

const UNAVAILABLE = "Cupom inválido ou indisponível.";

const COMMITTED_STATUSES: VoucherRedemptionStatus[] = ["RESERVED", "CONFIRMED"];

export type VoucherQuote = {
  voucherId: string;
  code: string;
  discountCents: number;
  /** desconto efetivo (não excede a taxa) */
  appliedDiscountCents: number;
  listCents: number;
  amountCents: number;
};

type TxClient = Prisma.TransactionClient;

/** Cota o cupom sem reservar estoque. */
export async function quoteVoucher(params: {
  code: string;
  feeCents: number;
  now?: Date;
}): Promise<VoucherQuote> {
  const code = normalizeVoucherCode(params.code);
  const now = params.now ?? new Date();
  const voucher = await db.voucher.findUnique({ where: { code } });
  if (!voucher) throw new Error(UNAVAILABLE);

  assertVoucherUsable(voucher, now);

  const committed = await countCommittedUses(db, voucher.id);
  if (voucher.maxUses != null && committed >= voucher.maxUses) {
    throw new Error(UNAVAILABLE);
  }

  return buildQuote(voucher, params.feeCents);
}

/** Reserva (ou confirma, no FREE) uma redemption com lock de estoque. */
export async function reserveVoucher(params: {
  voucherId: string;
  registrationId: string;
  paymentId: string;
  guardianId: string;
  discountCents: number;
  status?: "RESERVED" | "CONFIRMED";
  tx?: TxClient;
}): Promise<void> {
  const status = params.status ?? "RESERVED";
  const run = async (tx: TxClient) => {
    await lockVoucherRow(tx, params.voucherId);

    const voucher = await tx.voucher.findUnique({ where: { id: params.voucherId } });
    if (!voucher || !voucher.active) throw new Error(UNAVAILABLE);

    const now = new Date();
    assertVoucherWindow(voucher, now);

    if (voucher.maxUses != null) {
      const committed = await countCommittedUses(tx, voucher.id);
      if (committed >= voucher.maxUses) throw new Error(UNAVAILABLE);
    }

    await tx.voucherRedemption.create({
      data: {
        voucherId: params.voucherId,
        registrationId: params.registrationId,
        paymentId: params.paymentId,
        guardianId: params.guardianId,
        discountCents: params.discountCents,
        status,
      },
    });
  };

  if (params.tx) {
    await run(params.tx);
    return;
  }
  await db.$transaction(run);
}

/**
 * Confirma redemption do pagamento (idempotente).
 * RELEASED também vira CONFIRMED: se a cobrança foi efetivamente paga
 * (ex.: usuário pagou um PIX antigo após trocar de método), o desconto foi
 * honrado e o uso precisa contar — mesmo que a reserva tenha sido liberada.
 */
export async function confirmVoucherRedemption(paymentId: string, tx?: TxClient): Promise<void> {
  const client = tx ?? db;
  const redemption = await client.voucherRedemption.findUnique({ where: { paymentId } });
  if (!redemption) return;
  if (redemption.status === "CONFIRMED") return;

  await client.voucherRedemption.update({
    where: { id: redemption.id },
    data: { status: "CONFIRMED" },
  });
}

/** Libera redemption (estoque volta). Idempotente. */
export async function releaseVoucherRedemption(paymentId: string, tx?: TxClient): Promise<void> {
  const client = tx ?? db;
  const redemption = await client.voucherRedemption.findUnique({ where: { paymentId } });
  if (!redemption) return;
  if (redemption.status === "RELEASED") return;

  await client.voucherRedemption.update({
    where: { id: redemption.id },
    data: { status: "RELEASED" },
  });
}

/** Libera todas as reservas de cobranças PENDING da inscrição (nova tentativa). */
export async function releaseReservedForRegistration(
  registrationId: string,
  opts?: { exceptPaymentId?: string; tx?: TxClient },
): Promise<void> {
  const client = opts?.tx ?? db;
  const pending = await client.payment.findMany({
    where: {
      registrationId,
      status: "PENDING",
      ...(opts?.exceptPaymentId ? { id: { not: opts.exceptPaymentId } } : {}),
    },
    select: { id: true },
  });

  for (const payment of pending) {
    await releaseVoucherRedemption(payment.id, client);
  }
}

// ─── Admin CRUD ───────────────────────────────────────────

const adminVoucherSelect = {
  id: true,
  code: true,
  description: true,
  discountCents: true,
  maxUses: true,
  startsAt: true,
  endsAt: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VoucherSelect;

export type AdminVoucher = Prisma.VoucherGetPayload<{ select: typeof adminVoucherSelect }> & {
  confirmedCount: number;
  reservedCount: number;
};

export async function listAdminVouchers(filters: AdminVoucherFilters) {
  const where = buildAdminWhere(filters);
  const total = await db.voucher.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.voucher.findMany({
    where,
    select: adminVoucherSelect,
    orderBy: { createdAt: "desc" },
    skip,
    take: pagination.pageSize,
  });

  const withCounts = await attachCounts(items);
  return { items: withCounts, pagination };
}

export async function getAdminVoucher(voucherId: string) {
  const voucher = await db.voucher.findUnique({
    where: { id: voucherId },
    select: adminVoucherSelect,
  });
  if (!voucher) return null;

  const [withCounts] = await attachCounts([voucher]);
  const anyRedemptionCount = await db.voucherRedemption.count({ where: { voucherId } });
  const redemptions = await db.voucherRedemption.findMany({
    where: { voucherId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      discountCents: true,
      createdAt: true,
      paymentId: true,
      registration: { select: { protocol: true, id: true } },
      guardian: {
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return {
    ...withCounts,
    hasAnyRedemption: anyRedemptionCount > 0,
    redemptions,
  };
}

export async function createVoucher(input: VoucherFormInput) {
  await assertCodeAvailable(input.code);

  return db.voucher.create({
    data: {
      code: input.code,
      description: input.description,
      discountCents: input.discountCents,
      maxUses: input.maxUses,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      active: input.active,
    },
    select: adminVoucherSelect,
  });
}

export async function updateVoucher(voucherId: string, input: VoucherFormInput) {
  const existing = await db.voucher.findUnique({ where: { id: voucherId } });
  if (!existing) throw new Error("Voucher não encontrado.");

  const anyRedemption = await db.voucherRedemption.count({ where: { voucherId } });
  if (anyRedemption > 0) {
    if (input.code !== existing.code) {
      throw new Error("O código não pode ser alterado após o primeiro uso.");
    }
    if (input.discountCents !== existing.discountCents) {
      throw new Error("O desconto não pode ser alterado após o primeiro uso.");
    }
  } else if (input.code !== existing.code) {
    await assertCodeAvailable(input.code, voucherId);
  }

  const committed = await countCommittedUses(db, voucherId);
  if (input.maxUses != null && input.maxUses < committed) {
    throw new Error(
      `O limite não pode ser menor que os usos já comprometidos (${committed}).`,
    );
  }

  return db.voucher.update({
    where: { id: voucherId },
    data: {
      code: input.code,
      description: input.description,
      discountCents: input.discountCents,
      maxUses: input.maxUses,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      active: input.active,
    },
    select: adminVoucherSelect,
  });
}

// ─── helpers ──────────────────────────────────────────────

function buildQuote(
  voucher: { id: string; code: string; discountCents: number },
  feeCents: number,
): VoucherQuote {
  const appliedDiscountCents = Math.min(voucher.discountCents, Math.max(0, feeCents));
  return {
    voucherId: voucher.id,
    code: voucher.code,
    discountCents: voucher.discountCents,
    appliedDiscountCents,
    listCents: feeCents,
    amountCents: Math.max(0, feeCents - appliedDiscountCents),
  };
}

function assertVoucherUsable(
  voucher: {
    active: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  },
  now: Date,
) {
  if (!voucher.active) throw new Error(UNAVAILABLE);
  assertVoucherWindow(voucher, now);
}

function assertVoucherWindow(
  voucher: { startsAt: Date | null; endsAt: Date | null },
  now: Date,
) {
  if (voucher.startsAt && now < voucher.startsAt) throw new Error(UNAVAILABLE);
  if (voucher.endsAt && now > voucher.endsAt) throw new Error(UNAVAILABLE);
}

async function countCommittedUses(
  client: TxClient | typeof db,
  voucherId: string,
): Promise<number> {
  return client.voucherRedemption.count({
    where: { voucherId, status: { in: COMMITTED_STATUSES } },
  });
}

async function lockVoucherRow(tx: TxClient, voucherId: string) {
  await tx.$queryRaw`SELECT id FROM vouchers WHERE id = ${voucherId} FOR UPDATE`;
}

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await db.voucher.findUnique({ where: { code } });
  if (existing && existing.id !== excludeId) {
    throw new Error("Já existe um voucher com este código.");
  }
}

function buildAdminWhere(filters: AdminVoucherFilters): Prisma.VoucherWhereInput {
  const where: Prisma.VoucherWhereInput = {};

  if (filters.active === "active") where.active = true;
  if (filters.active === "inactive") where.active = false;

  if (filters.q) {
    where.OR = [
      { code: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

async function attachCounts(
  items: Prisma.VoucherGetPayload<{ select: typeof adminVoucherSelect }>[],
): Promise<AdminVoucher[]> {
  if (items.length === 0) return [];

  const ids = items.map((item) => item.id);
  const groups = await db.voucherRedemption.groupBy({
    by: ["voucherId", "status"],
    where: { voucherId: { in: ids }, status: { in: COMMITTED_STATUSES } },
    _count: { _all: true },
  });

  const map = new Map<string, { confirmedCount: number; reservedCount: number }>();
  for (const id of ids) {
    map.set(id, { confirmedCount: 0, reservedCount: 0 });
  }
  for (const group of groups) {
    const entry = map.get(group.voucherId)!;
    if (group.status === "CONFIRMED") entry.confirmedCount = group._count._all;
    if (group.status === "RESERVED") entry.reservedCount = group._count._all;
  }

  return items.map((item) => ({
    ...item,
    ...map.get(item.id)!,
  }));
}

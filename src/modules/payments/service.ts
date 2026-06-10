import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { asaas, AsaasError } from "@/shared/integrations/asaas/client";
import type {
  AsaasBillingType,
  AsaasCreditCard,
} from "@/shared/integrations/asaas/types";
import type { Prisma } from "@/generated/prisma/client";
import type { PaymentStatus } from "@/generated/prisma/enums";
import { sendRegistrationToReview } from "@/modules/registrations/service";
import type { AdminPaymentFilters } from "./validators";

/**
 * Módulo Payments: checkout da inscrição via Asaas (PIX, Boleto, Cartão).
 * Spec: docs/modules/payments.md
 *
 * Confirmação:
 * - fonte de verdade = webhook (webhook-handler.ts)
 * - polling do PIX usa syncPaymentStatus como conciliação ativa (fallback
 *   para dev/local sem webhook e para feedback imediato na UI)
 */

const DUE_DAYS = 3;
const PAID_STATUSES: PaymentStatus[] = ["CONFIRMED", "RECEIVED"];

/** Mapeia status do Asaas → enum local (mesma régua do webhook). */
const STATUS_FROM_ASAAS: Record<string, PaymentStatus> = {
  PENDING: "PENDING",
  AWAITING_RISK_ANALYSIS: "PENDING",
  CONFIRMED: "CONFIRMED",
  RECEIVED: "RECEIVED",
  RECEIVED_IN_CASH: "RECEIVED",
  OVERDUE: "OVERDUE",
  REFUNDED: "REFUNDED",
  REFUND_REQUESTED: "REFUNDED",
  DELETED: "CANCELED",
  CANCELED: "CANCELED",
};

export function isPaidStatus(status: PaymentStatus): boolean {
  return PAID_STATUSES.includes(status);
}

/** Garante que o responsável possui um customer no Asaas e retorna o id. */
export async function ensureAsaasCustomer(guardianId: string): Promise<string> {
  const guardian = await db.guardianProfile.findUniqueOrThrow({
    where: { id: guardianId },
    include: { user: true },
  });

  if (guardian.asaasCustomerId) return guardian.asaasCustomerId;
  if (!guardian.cpf) throw new Error("CPF do responsável é obrigatório para o pagamento.");

  const customer = await asaas.createCustomer({
    name: guardian.user.name,
    email: guardian.user.email,
    cpfCnpj: guardian.cpf,
    mobilePhone: guardian.whatsapp ?? undefined,
  });

  await db.guardianProfile.update({
    where: { id: guardianId },
    data: { asaasCustomerId: customer.id },
  });

  return customer.id;
}

export type CheckoutResult = {
  paymentId: string;
  status: PaymentStatus;
  method: AsaasBillingType;
  amountCents: number;
  dueDate: Date | null;
  invoiceUrl: string | null;
  boletoUrl: string | null;
  pixPayload: string | null;
  pixQrCodeBase64: string | null;
  paid: boolean;
};

/**
 * Cria a cobrança no Asaas e o Payment local.
 *
 * Reuso: se já existe um Payment PENDING do mesmo método e não vencido,
 * retorna a cobrança existente em vez de criar outra (evita cobranças
 * duplicadas quando o usuário recarrega a tela do PIX/boleto).
 *
 * Cartão: dados transitam apenas nesta chamada (nunca persistidos);
 * a confirmação do Asaas para cartão é síncrona na resposta.
 */
export async function createCheckout(params: {
  registrationId: string;
  guardianId: string;
  method: AsaasBillingType;
  creditCard?: AsaasCreditCard;
  remoteIp?: string;
}): Promise<CheckoutResult> {
  const registration = await db.registration.findUniqueOrThrow({
    where: { id: params.registrationId },
    include: {
      contest: true,
      participant: { include: { guardian: { include: { user: true } } } },
      _count: { select: { photos: true } },
    },
  });

  if (registration.participant.guardianId !== params.guardianId) {
    throw new Error("Inscrição não pertence a este responsável.");
  }
  if (!["DRAFT", "PENDING_PAYMENT"].includes(registration.status)) {
    throw new Error("Esta inscrição não está aguardando pagamento.");
  }
  if (registration._count.photos < 2) {
    throw new Error("Envie as 2 fotos antes de ir para o pagamento.");
  }

  // Reuso de cobrança pendente (PIX/Boleto). Cartão sempre cria nova tentativa.
  if (params.method !== "CREDIT_CARD") {
    const existing = await db.payment.findFirst({
      where: {
        registrationId: registration.id,
        method: params.method,
        status: "PENDING",
        dueDate: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.asaasPaymentId) {
      const pix =
        params.method === "PIX"
          ? await asaas.getPixQrCode(existing.asaasPaymentId).catch(() => null)
          : null;
      return toCheckoutResult(existing, pix?.encodedImage ?? null);
    }
  }

  const customerId = await ensureAsaasCustomer(params.guardianId);
  const dueDate = new Date(Date.now() + DUE_DAYS * 24 * 60 * 60 * 1000);
  const guardian = registration.participant.guardian;

  let asaasPayment;
  try {
    asaasPayment = await asaas.createPayment({
      customer: customerId,
      billingType: params.method,
      value: registration.contest.registrationFeeCents / 100,
      dueDate: dueDate.toISOString().slice(0, 10),
      description: `Inscrição ${registration.contest.name} - ${registration.participant.name}`,
      externalReference: registration.id,
      ...(params.method === "CREDIT_CARD" && params.creditCard
        ? {
            creditCard: params.creditCard,
            creditCardHolderInfo: {
              name: guardian.user.name,
              email: guardian.user.email,
              cpfCnpj: guardian.cpf!,
              postalCode: guardian.zipCode ?? "00000000",
              addressNumber: guardian.number ?? "S/N",
              addressComplement: guardian.complement ?? undefined,
              phone: guardian.whatsapp ?? guardian.user.phone ?? "",
            },
            remoteIp: params.remoteIp,
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof AsaasError) {
      throw new Error(error.friendlyMessage ?? "Não foi possível processar o pagamento.");
    }
    throw error;
  }

  const initialStatus = STATUS_FROM_ASAAS[asaasPayment.status] ?? "PENDING";
  const paidNow = isPaidStatus(initialStatus); // cartão aprova síncrono

  const pix =
    params.method === "PIX" ? await asaas.getPixQrCode(asaasPayment.id).catch(() => null) : null;

  const payment = await db.payment.create({
    data: {
      registrationId: registration.id,
      asaasPaymentId: asaasPayment.id,
      method: params.method,
      status: initialStatus,
      amountCents: registration.contest.registrationFeeCents,
      dueDate,
      paidAt: paidNow ? new Date() : null,
      invoiceUrl: asaasPayment.invoiceUrl,
      boletoUrl: asaasPayment.bankSlipUrl,
      pixPayload: pix?.payload,
    },
  });

  await db.registration.update({
    where: { id: registration.id },
    data: { status: paidNow ? "UNDER_REVIEW" : "PENDING_PAYMENT" },
  });

  return toCheckoutResult(payment, pix?.encodedImage ?? null);
}

/**
 * Conciliação ativa: consulta o Asaas e atualiza Payment/Registration.
 * Usada pelo polling do PIX. Idempotente com o webhook (mesma régua de status).
 */
export async function syncPaymentStatus(
  paymentId: string,
  guardianId: string,
): Promise<{
  status: PaymentStatus;
  paid: boolean;
}> {
  const payment = await db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      registration: {
        select: { id: true, status: true, participant: { select: { guardianId: true } } },
      },
    },
  });

  if (payment.registration.participant.guardianId !== guardianId) {
    throw new Error("Pagamento não pertence a este responsável.");
  }

  // Já finalizado localmente (provavelmente via webhook) — nada a consultar.
  if (payment.status !== "PENDING") {
    return { status: payment.status, paid: isPaidStatus(payment.status) };
  }
  if (!payment.asaasPaymentId) {
    return { status: payment.status, paid: false };
  }

  const remote = await asaas.getPayment(payment.asaasPaymentId);
  const mapped = STATUS_FROM_ASAAS[remote.status] ?? "PENDING";
  if (mapped === payment.status) {
    return { status: mapped, paid: false };
  }

  const paid = isPaidStatus(mapped);
  await db.payment.update({
    where: { id: payment.id },
    data: { status: mapped, paidAt: paid ? new Date() : payment.paidAt },
  });

  if (paid && payment.registration.status === "PENDING_PAYMENT") {
    await sendRegistrationToReview(payment.registration.id);
  }

  return { status: mapped, paid };
}

/** Cobrança ativa (não vencida/cancelada) da inscrição, para retomada. */
export async function getActivePayment(registrationId: string, guardianId: string) {
  const payment = await db.payment.findFirst({
    where: {
      registrationId,
      registration: { participant: { guardianId } },
      status: { in: ["PENDING", "CONFIRMED", "RECEIVED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) return null;

  const pixQrCodeBase64 =
    payment.method === "PIX" && payment.status === "PENDING" && payment.asaasPaymentId
      ? await asaas
          .getPixQrCode(payment.asaasPaymentId)
          .then((pix) => pix.encodedImage)
          .catch(() => null)
      : null;

  return toCheckoutResult(payment, pixQrCodeBase64);
}

/** Listagem administrativa de cobranças paginada e filtrável. */
export async function listAdminPayments(filters: AdminPaymentFilters) {
  const where = buildAdminPaymentWhere(filters);
  const total = await db.payment.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.payment.findMany({
    where,
    include: {
      registration: {
        include: {
          contest: true,
          category: true,
          participant: {
            include: {
              guardian: {
                include: {
                  user: { select: { name: true, email: true, phone: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: filters.pageSize,
  });

  return { items, pagination };
}

function buildAdminPaymentWhere(filters: AdminPaymentFilters): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.method) where.method = filters.method;

  if (filters.q) {
    where.OR = [
      { asaasPaymentId: { contains: filters.q, mode: "insensitive" } },
      { registration: { protocol: { contains: filters.q, mode: "insensitive" } } },
      { registration: { participant: { name: { contains: filters.q, mode: "insensitive" } } } },
      {
        registration: {
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
      },
    ];
  }

  return where;
}

type PaymentRow = {
  id: string;
  status: PaymentStatus;
  method: "PIX" | "BOLETO" | "CREDIT_CARD";
  amountCents: number;
  dueDate: Date | null;
  invoiceUrl: string | null;
  boletoUrl: string | null;
  pixPayload: string | null;
};

function toCheckoutResult(payment: PaymentRow, pixQrCodeBase64: string | null): CheckoutResult {
  return {
    paymentId: payment.id,
    status: payment.status,
    method: payment.method,
    amountCents: payment.amountCents,
    dueDate: payment.dueDate,
    invoiceUrl: payment.invoiceUrl,
    boletoUrl: payment.boletoUrl,
    pixPayload: payment.pixPayload,
    pixQrCodeBase64,
    paid: isPaidStatus(payment.status),
  };
}

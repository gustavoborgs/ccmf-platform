"use server";

import { headers } from "next/headers";
import { resolveEnrollmentGuardianId } from "@/modules/registrations/context";
import { previewVoucherInputSchema } from "@/modules/vouchers/validators";
import {
  createCheckout,
  getActivePayment,
  previewCheckoutVoucher,
  syncPaymentStatus,
  type CheckoutResult,
} from "./service";
import { checkoutInputSchema } from "./validators";
import { formatCentsBRL } from "@/shared/utils";

/**
 * Server Actions do checkout (wizard de inscrição).
 * Autorização: ref assinado da URL (?ref=) OU sessão de GUARDIAN logado —
 * o service ainda valida que a inscrição pertence ao responsável.
 * Spec: docs/modules/payments.md
 */

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

/** Dados do checkout serializados para o client (sem Date/centavos crus). */
export type CheckoutData = {
  paymentId: string;
  status: string;
  method: "PIX" | "BOLETO" | "CREDIT_CARD" | "FREE";
  amountCents: number;
  amountFormatted: string;
  originalAmountCents: number;
  originalAmountFormatted: string;
  discountCents: number;
  discountFormatted: string | null;
  voucherCode: string | null;
  dueDateFormatted: string | null;
  invoiceUrl: string | null;
  boletoUrl: string | null;
  pixPayload: string | null;
  pixQrCodeBase64: string | null;
  paid: boolean;
  isFree: boolean;
};

export type VoucherPreviewData = {
  code: string;
  listCents: number;
  listFormatted: string;
  discountCents: number;
  discountFormatted: string;
  amountCents: number;
  amountFormatted: string;
  isFree: boolean;
};

function toCheckoutData(result: CheckoutResult): CheckoutData {
  return {
    paymentId: result.paymentId,
    status: result.status,
    method: result.method,
    amountCents: result.amountCents,
    amountFormatted: formatCentsBRL(result.amountCents),
    originalAmountCents: result.originalAmountCents,
    originalAmountFormatted: formatCentsBRL(result.originalAmountCents),
    discountCents: result.discountCents,
    discountFormatted:
      result.discountCents > 0 ? formatCentsBRL(result.discountCents) : null,
    voucherCode: result.voucherCode,
    dueDateFormatted: result.dueDate
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(result.dueDate)
      : null,
    invoiceUrl: result.invoiceUrl,
    boletoUrl: result.boletoUrl,
    pixPayload: result.pixPayload,
    pixQrCodeBase64: result.pixQrCodeBase64,
    paid: result.paid,
    isFree: result.method === "FREE" || result.amountCents === 0,
  };
}

/** Cria (ou reutiliza) a cobrança no Asaas / FREE para o método escolhido. */
export async function createCheckoutAction(
  rawRef: string | null,
  input: unknown,
): Promise<ActionResult<CheckoutData>> {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const guardianId = await resolveEnrollmentGuardianId(rawRef);
  if (!guardianId) return { ok: false, error: "Referência inválida. Use seu link de retomada." };

  const headerList = await headers();
  const remoteIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    undefined;

  try {
    const result = await createCheckout({
      registrationId: parsed.data.registrationId,
      guardianId,
      method: parsed.data.method,
      creditCard: parsed.data.method === "CREDIT_CARD" ? parsed.data.creditCard : undefined,
      remoteIp,
      voucherCode: parsed.data.voucherCode,
    });
    return { ok: true, data: toCheckoutData(result) };
  } catch (error) {
    return fail(error);
  }
}

/** Preview de cupom (não reserva estoque). */
export async function previewVoucherAction(
  rawRef: string | null,
  input: unknown,
): Promise<ActionResult<VoucherPreviewData>> {
  const parsed = previewVoucherInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Cupom inválido." };
  }

  const guardianId = await resolveEnrollmentGuardianId(rawRef);
  if (!guardianId) return { ok: false, error: "Referência inválida. Use seu link de retomada." };

  try {
    const quote = await previewCheckoutVoucher({
      registrationId: parsed.data.registrationId,
      guardianId,
      code: parsed.data.code,
    });
    return {
      ok: true,
      data: {
        code: quote.code,
        listCents: quote.listCents,
        listFormatted: formatCentsBRL(quote.listCents),
        discountCents: quote.appliedDiscountCents,
        discountFormatted: formatCentsBRL(quote.appliedDiscountCents),
        amountCents: quote.amountCents,
        amountFormatted: formatCentsBRL(quote.amountCents),
        isFree: quote.amountCents === 0,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/** Cobrança ativa da inscrição (retomada da tela de pagamento). */
export async function getActiveCheckoutAction(
  rawRef: string | null,
  registrationId: string,
): Promise<ActionResult<CheckoutData | null>> {
  const guardianId = await resolveEnrollmentGuardianId(rawRef);
  if (!guardianId) return { ok: false, error: "Referência inválida. Use seu link de retomada." };

  try {
    const result = await getActivePayment(registrationId, guardianId);
    return { ok: true, data: result ? toCheckoutData(result) : null };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Polling do pagamento (PIX/boleto): concilia com o Asaas e devolve o status.
 * O webhook continua sendo a fonte de verdade — isto é conciliação ativa.
 */
export async function pollPaymentStatusAction(
  rawRef: string | null,
  paymentId: string,
): Promise<ActionResult<{ status: string; paid: boolean }>> {
  const guardianId = await resolveEnrollmentGuardianId(rawRef);
  if (!guardianId) return { ok: false, error: "Referência inválida." };

  try {
    const result = await syncPaymentStatus(paymentId, guardianId);
    return { ok: true, data: result };
  } catch (error) {
    return fail(error);
  }
}

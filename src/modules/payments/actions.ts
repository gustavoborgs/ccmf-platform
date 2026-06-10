"use server";

import { headers } from "next/headers";
import { resolveEnrollmentGuardianId } from "@/modules/registrations/context";
import {
  createCheckout,
  getActivePayment,
  syncPaymentStatus,
  type CheckoutResult,
} from "./service";
import { checkoutInputSchema } from "./validators";
import { formatCentsBRL } from "@/shared/utils";

/**
 * Server Actions do checkout (wizard de inscrição).
 * Autorização: cookie assinado do wizard OU sessão de GUARDIAN logado —
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
  method: "PIX" | "BOLETO" | "CREDIT_CARD";
  amountFormatted: string;
  dueDateFormatted: string | null;
  invoiceUrl: string | null;
  boletoUrl: string | null;
  pixPayload: string | null;
  pixQrCodeBase64: string | null;
  paid: boolean;
};

function toCheckoutData(result: CheckoutResult): CheckoutData {
  return {
    paymentId: result.paymentId,
    status: result.status,
    method: result.method,
    amountFormatted: formatCentsBRL(result.amountCents),
    dueDateFormatted: result.dueDate
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(result.dueDate)
      : null,
    invoiceUrl: result.invoiceUrl,
    boletoUrl: result.boletoUrl,
    pixPayload: result.pixPayload,
    pixQrCodeBase64: result.pixQrCodeBase64,
    paid: result.paid,
  };
}

/** Cria (ou reutiliza) a cobrança no Asaas para o método escolhido. */
export async function createCheckoutAction(input: unknown): Promise<ActionResult<CheckoutData>> {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const guardianId = await resolveEnrollmentGuardianId();
  if (!guardianId) return { ok: false, error: "Sessão expirada. Use seu link de retomada." };

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
    });
    return { ok: true, data: toCheckoutData(result) };
  } catch (error) {
    return fail(error);
  }
}

/** Cobrança ativa da inscrição (retomada da tela de pagamento). */
export async function getActiveCheckoutAction(
  registrationId: string,
): Promise<ActionResult<CheckoutData | null>> {
  const guardianId = await resolveEnrollmentGuardianId();
  if (!guardianId) return { ok: false, error: "Sessão expirada. Use seu link de retomada." };

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
  paymentId: string,
): Promise<ActionResult<{ status: string; paid: boolean }>> {
  const guardianId = await resolveEnrollmentGuardianId();
  if (!guardianId) return { ok: false, error: "Sessão expirada." };

  try {
    const result = await syncPaymentStatus(paymentId, guardianId);
    return { ok: true, data: result };
  } catch (error) {
    return fail(error);
  }
}

import { db } from "@/shared/db";
import { sendRegistrationToReview } from "@/modules/registrations/service";
import type { AsaasWebhookEvent } from "@/shared/integrations/asaas/types";

/**
 * Processamento dos webhooks do Asaas (idempotente).
 * Spec: docs/modules/payments.md + docs/integrations/asaas.md
 */

const PAYMENT_STATUS_BY_EVENT: Record<string, "CONFIRMED" | "RECEIVED" | "OVERDUE" | "REFUNDED" | "CANCELED"> = {
  PAYMENT_CONFIRMED: "CONFIRMED",
  PAYMENT_RECEIVED: "RECEIVED",
  PAYMENT_OVERDUE: "OVERDUE",
  PAYMENT_REFUNDED: "REFUNDED",
  PAYMENT_DELETED: "CANCELED",
};

export async function processAsaasWebhook(event: AsaasWebhookEvent) {
  const externalId = getWebhookExternalId(event);
  if (!externalId) return;

  // Idempotência: cada evento do Asaas é processado uma única vez.
  const existing = await db.webhookEvent.findUnique({ where: { externalId } });
  if (existing?.processedAt) return;

  await db.webhookEvent.upsert({
    where: { externalId },
    update: {},
    create: {
      externalId,
      eventType: event.event,
      payload: JSON.parse(JSON.stringify(event)),
    },
  });

  try {
    await applyEvent(event);
    await db.webhookEvent.update({
      where: { externalId },
      data: { processedAt: new Date(), error: null },
    });
  } catch (error) {
    await db.webhookEvent.update({
      where: { externalId },
      data: { error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}

function getWebhookExternalId(event: AsaasWebhookEvent): string | null {
  if (event.id) return event.id;
  if (event.payment?.id) return `${event.event}:${event.payment.id}`;
  return null;
}

async function applyEvent(event: AsaasWebhookEvent) {
  const newStatus = PAYMENT_STATUS_BY_EVENT[event.event];
  if (!newStatus || !event.payment) return; // evento não relevante para o domínio

  const payment = await db.payment.findUnique({
    where: { asaasPaymentId: event.payment.id },
    include: { registration: { select: { id: true, status: true } } },
  });
  if (!payment) return;

  const isPaid = newStatus === "CONFIRMED" || newStatus === "RECEIVED";

  await db.payment.update({
    where: { id: payment.id },
    data: { status: newStatus, paidAt: isPaid ? new Date() : payment.paidAt },
  });

  // O funil do CRM é derivado de Registration.status — nada a atualizar em Lead.
  if (isPaid && payment.registration.status === "PENDING_PAYMENT") {
    await sendRegistrationToReview(payment.registrationId);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { isValidWebhookToken } from "@/shared/integrations/asaas/client";
import type { AsaasWebhookEvent } from "@/shared/integrations/asaas/types";
import { processAsaasWebhook } from "@/modules/payments/webhook-handler";

/**
 * Webhook do Asaas. Spec: docs/integrations/asaas.md
 * Sempre responde 200 para eventos válidos já registrados — o retry fica a
 * cargo do reprocessamento interno (tabela webhook_events). Payloads inválidos
 * ou falhas internas são logados, mas não bloqueiam a fila do Asaas.
 */
export async function POST(request: NextRequest) {
  if (!isValidWebhookToken(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch((error) => {
    console.error("[asaas-webhook] payload JSON inválido", error);
    return null;
  });

  if (!payload) {
    return NextResponse.json({ received: true });
  }

  const event = payload as AsaasWebhookEvent;

  try {
    await processAsaasWebhook(event);
  } catch (error) {
    console.error("[asaas-webhook] falha ao processar evento", event.id ?? event.event, error);
  }

  return NextResponse.json({ received: true });
}

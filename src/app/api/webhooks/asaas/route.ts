import { NextResponse, type NextRequest } from "next/server";
import { isValidWebhookToken } from "@/shared/integrations/asaas/client";
import type { AsaasWebhookEvent } from "@/shared/integrations/asaas/types";
import { processAsaasWebhook } from "@/modules/payments/webhook-handler";

/**
 * Webhook do Asaas. Spec: docs/integrations/asaas.md
 * Sempre responde 200 para eventos válidos já registrados — o retry fica a
 * cargo do reprocessamento interno (tabela webhook_events).
 */
export async function POST(request: NextRequest) {
  if (!isValidWebhookToken(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event = (await request.json()) as AsaasWebhookEvent;

  try {
    await processAsaasWebhook(event);
  } catch (error) {
    console.error("[asaas-webhook] falha ao processar evento", event.id, error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

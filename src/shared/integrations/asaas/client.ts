import { env } from "@/shared/env";
import type {
  AsaasCreatePaymentInput,
  AsaasCustomer,
  AsaasCustomerInput,
  AsaasPayment,
  AsaasPixQrCode,
} from "./types";

/**
 * Cliente HTTP do Asaas. Único ponto do código que fala com a API.
 * Spec: docs/integrations/asaas.md
 */

export class AsaasError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "AsaasError";
  }

  /** Mensagem amigável vinda da API (ex.: cartão recusado), se houver. */
  get friendlyMessage(): string | null {
    const body = this.body as { errors?: { description?: string }[] } | null;
    return body?.errors?.[0]?.description ?? null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: env.ASAAS_API_KEY,
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AsaasError(`Asaas request failed: ${path}`, response.status, body);
  }
  return body as T;
}

export const asaas = {
  createCustomer(input: AsaasCustomerInput) {
    return request<AsaasCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  createPayment(input: AsaasCreatePaymentInput) {
    return request<AsaasPayment>("/payments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getPayment(paymentId: string) {
    return request<AsaasPayment>(`/payments/${paymentId}`);
  },

  getPixQrCode(paymentId: string) {
    return request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
  },
};

/** Validação do webhook: o Asaas envia o token configurado no painel. */
export function isValidWebhookToken(token: string | null): boolean {
  return Boolean(token) && token === env.ASAAS_WEBHOOK_TOKEN;
}

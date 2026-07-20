import { NEVOA_TRACKING_TENANT } from "@/shared/analytics/config";
import { env } from "@/shared/env";

export type NevoaConversionEventInput = {
  eventName: string;
  sessionCode: string;
  transactionId?: string;
  value?: number;
  currency?: string;
  eventTime?: Date;
};

export type NevoaConversionEventResponse = {
  ok?: boolean;
  duplicate?: boolean;
  [key: string]: unknown;
};

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

function getConversionConfig() {
  const baseUrl = env.NEVOA_MANAGER_BASE_URL ? normalizeBaseUrl(env.NEVOA_MANAGER_BASE_URL) : null;
  const token = env.NEVOA_CONVERSION_API_TOKEN;
  const tenantId = NEVOA_TRACKING_TENANT;

  const missing = [
    !baseUrl ? "NEVOA_MANAGER_BASE_URL" : null,
    !token ? "NEVOA_CONVERSION_API_TOKEN" : null,
    !tenantId ? "NEXT_PUBLIC_NEVOA_TRACKING_TENANT" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    console.warn("[nevoa-conversions] Configuração ausente — conversão ignorada.", {
      missing,
    });
    return null;
  }

  return { baseUrl: baseUrl!, token: token!, tenantId };
}

/** Reporta conversão à API pública do Nevoa Manager (best-effort). */
export async function reportNevoaConversion(
  input: NevoaConversionEventInput,
): Promise<NevoaConversionEventResponse | null> {
  const config = getConversionConfig();
  if (!config) return null;

  const body: Record<string, unknown> = {
    event_name: input.eventName,
    session_code: input.sessionCode,
  };

  if (input.transactionId) body.transaction_id = input.transactionId;
  if (input.value !== undefined) body.value = input.value;
  if (input.currency) body.currency = input.currency;
  if (input.eventTime) body.event_time = input.eventTime.toISOString();

  const url = `${config.baseUrl}/public/conversions/${config.tenantId}/events`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-token": config.token,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as NevoaConversionEventResponse | null;

  if (!response.ok) {
    console.error("[nevoa-conversions] request failed", {
      url,
      status: response.status,
      eventName: input.eventName,
      transactionId: input.transactionId,
      body: payload,
    });
    throw new Error(`Nevoa conversions request failed (${response.status})`);
  }

  if (payload?.duplicate) {
    console.info("[nevoa-conversions] evento duplicado ignorado", {
      eventName: input.eventName,
      transactionId: input.transactionId,
    });
  } else {
    console.info("[nevoa-conversions] evento aceito", {
      eventName: input.eventName,
      transactionId: input.transactionId,
      tenantId: config.tenantId,
    });
  }

  return payload;
}

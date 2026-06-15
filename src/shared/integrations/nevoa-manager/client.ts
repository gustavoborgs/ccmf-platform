import { env } from "@/shared/env";

type NevoaBatchItem = {
  templateId: string;
  phone: string;
  variables: string[];
};

type SendTemplateBatchInput = {
  items: NevoaBatchItem[];
};

export type NevoaTemplateBatchResponse = {
  ok: boolean;
  batch_id: string;
  queued: number;
  jobIds: string[];
};

export class NevoaManagerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "NevoaManagerError";
  }
}

function getConfig() {
  const missing = [
    ["NEVOA_MANAGER_BASE_URL", env.NEVOA_MANAGER_BASE_URL],
    ["NEVOA_MANAGER_WEBHOOK_ID", env.NEVOA_MANAGER_WEBHOOK_ID],
    ["NEVOA_MANAGER_TOKEN", env.NEVOA_MANAGER_TOKEN],
  ].flatMap(([name, value]) => (value ? [] : [name]));

  if (missing.length) {
    throw new Error(`Configuração do nevoa-manager ausente: ${missing.join(", ")}.`);
  }

  return {
    baseUrl: env.NEVOA_MANAGER_BASE_URL!.replace(/\/$/, ""),
    webhookId: env.NEVOA_MANAGER_WEBHOOK_ID!,
    token: env.NEVOA_MANAGER_TOKEN!,
  };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("[nevoa-manager] request failed", {
      path,
      method: init.method ?? "GET",
      status: response.status,
      body,
    });
    throw new NevoaManagerError(`Nevoa Manager request failed: ${path}`, response.status, body);
  }

  return body as T;
}

export const nevoaManager = {
  sendTemplateBatch(input: SendTemplateBatchInput) {
    const { webhookId, token } = getConfig();
    return request<NevoaTemplateBatchResponse>(
      `/webhooks/external/${webhookId}/send-template/batch`,
      {
        method: "POST",
        body: JSON.stringify({ token, items: input.items }),
      },
    );
  },
};

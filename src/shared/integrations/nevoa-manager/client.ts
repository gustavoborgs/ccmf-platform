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

const BATCH_CHUNK_SIZE = 20;

export class NevoaManagerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "NevoaManagerError";
  }

  /** Mensagem legível vinda da API, quando disponível. */
  get friendlyMessage(): string {
    const body = this.body;
    if (typeof body === "string" && body.trim()) return body.trim();

    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const candidates = [record.message, record.error, record.detail, record.details];
      for (const value of candidates) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (Array.isArray(value) && value.length) {
          return value.map(String).join("; ");
        }
      }
    }

    return `Nevoa Manager HTTP ${this.status}`;
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
    baseUrl: normalizeBaseUrl(env.NEVOA_MANAGER_BASE_URL!),
    webhookId: env.NEVOA_MANAGER_WEBHOOK_ID!,
    token: env.NEVOA_MANAGER_TOKEN!,
  };
}

/** Garante base `.../api` conforme contrato do nevoa-manager. */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

function buildBatchPath(webhookId: string): string {
  return `/webhooks/external/${webhookId}/send-template/batch`;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { baseUrl } = getConfig();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[nevoa-manager] request failed", {
      url,
      path,
      method: init.method ?? "GET",
      status: response.status,
      body,
    });
    throw new NevoaManagerError(`Nevoa Manager request failed: ${path}`, response.status, body);
  }

  if (body && typeof body === "object" && "ok" in body && (body as { ok?: boolean }).ok === false) {
    console.error("[nevoa-manager] logical error", { url, path, body });
    throw new NevoaManagerError(`Nevoa Manager rejected request: ${path}`, response.status, body);
  }

  return body as T;
}

async function sendTemplateBatchChunk(items: NevoaBatchItem[]): Promise<NevoaTemplateBatchResponse> {
  const { webhookId, token } = getConfig();
  return request<NevoaTemplateBatchResponse>(buildBatchPath(webhookId), {
    method: "POST",
    body: JSON.stringify({ token, items }),
  });
}

export function formatNevoaManagerError(error: unknown): string {
  if (error instanceof NevoaManagerError) {
    return `${error.friendlyMessage} (HTTP ${error.status})`;
  }
  if (error instanceof Error) return error.message;
  return "Falha desconhecida no nevoa-manager.";
}

export const nevoaManager = {
  async sendTemplateBatch(input: SendTemplateBatchInput): Promise<NevoaTemplateBatchResponse> {
    if (!input.items.length) {
      return { ok: true, batch_id: "", queued: 0, jobIds: [] };
    }

    const chunks: NevoaBatchItem[][] = [];
    for (let index = 0; index < input.items.length; index += BATCH_CHUNK_SIZE) {
      chunks.push(input.items.slice(index, index + BATCH_CHUNK_SIZE));
    }

    const responses: NevoaTemplateBatchResponse[] = [];
    for (const chunk of chunks) {
      responses.push(await sendTemplateBatchChunk(chunk));
    }

    return {
      ok: responses.every((response) => response.ok),
      batch_id: responses.map((response) => response.batch_id).filter(Boolean).join(",") || "",
      queued: responses.reduce((sum, response) => sum + response.queued, 0),
      jobIds: responses.flatMap((response) => response.jobIds ?? []),
    };
  },
};

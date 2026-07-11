/** Espelha o snippet Nevoa — chave e TTL do localStorage. */
export const NEVOA_SESSION_STORAGE_KEY = "nevoaTrack:session";

type StoredNevoaSession = {
  code?: string;
  expiresAt?: number;
};

/** Lê o código de sessão Nevoa do localStorage (sem prefixo NV-). */
export function readNevoaSessionCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(NEVOA_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as StoredNevoaSession;
    if (data.expiresAt && Date.now() > data.expiresAt) {
      window.localStorage.removeItem(NEVOA_SESSION_STORAGE_KEY);
      return null;
    }

    return typeof data.code === "string" && data.code.trim() ? data.code.trim() : null;
  } catch {
    return null;
  }
}

/** Aguarda o snippet criar a sessão (best-effort, assíncrono no browser). */
export function waitForNevoaSessionCode(options: { timeoutMs?: number; intervalMs?: number } = {}) {
  const { timeoutMs = 3_000, intervalMs = 200 } = options;

  return new Promise<string | null>((resolve) => {
    const existing = readNevoaSessionCode();
    if (existing) {
      resolve(existing);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const code = readNevoaSessionCode();
      if (code || Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        resolve(code);
      }
    }, intervalMs);
  });
}

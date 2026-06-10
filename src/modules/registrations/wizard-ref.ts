import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/shared/env";

/**
 * Referência do wizard de inscrição: token HMAC assinado que vive na URL
 * (`/inscricao?ref=...`) — substitui o cookie. Quem tem o link continua
 * exatamente aquela inscrição; sem ref, o wizard começa do início.
 * NÃO autentica o usuário nem dá acesso à /conta.
 * Spec: docs/modules/registrations.md
 */

export type WizardRef = {
  guardianId: string;
  registrationId?: string;
};

function sign(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

export function serializeWizardRef(ref: WizardRef): string {
  const payload = Buffer.from(JSON.stringify(ref)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Decodifica e valida a assinatura; token inválido/adulterado → null. */
export function parseWizardRef(value: string | null | undefined): WizardRef | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as WizardRef;
    return parsed.guardianId ? parsed : null;
  } catch {
    return null;
  }
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/shared/env";

/**
 * Sessão do wizard de inscrição: cookie httpOnly assinado (HMAC) com escopo
 * restrito ao fluxo — NÃO autentica o usuário nem dá acesso à /conta.
 * Spec: docs/modules/registrations.md
 */

const COOKIE_NAME = "ccmf_wizard";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias (retomada via link é permanente)

export const wizardCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export type WizardSession = {
  guardianId: string;
  registrationId?: string;
};

function sign(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

/** Valor assinado do cookie — usar em Route Handlers com NextResponse.cookies.set. */
export function serializeWizardSession(session: WizardSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): WizardSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as WizardSession;
  } catch {
    return null;
  }
}

export async function setWizardSession(session: WizardSession) {
  const store = await cookies();
  store.set(COOKIE_NAME, serializeWizardSession(session), wizardCookieOptions);
}

export async function getWizardSession(): Promise<WizardSession | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return value ? decode(value) : null;
}

export async function clearWizardSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

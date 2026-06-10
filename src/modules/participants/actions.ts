"use server";

import { headers } from "next/headers";
import { buildLikeFingerprint, likeRegistration } from "./service";
import { likeInputSchema } from "./validators";

/**
 * Server Actions públicas do módulo Participants.
 * Like anônimo, sem login: deduplicado por fingerprint (ip + user-agent).
 * Spec: docs/modules/participants.md
 */

type LikeResult =
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string };

export async function likeRegistrationAction(input: unknown): Promise<LikeResult> {
  const parsed = likeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inscrição inválida." };

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const fingerprint = buildLikeFingerprint(ip, userAgent);

  try {
    const result = await likeRegistration(parsed.data.registrationId, fingerprint);
    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "Não foi possível registrar a curtida. Tente novamente." };
  }
}

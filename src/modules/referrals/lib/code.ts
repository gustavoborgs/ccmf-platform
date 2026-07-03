import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";

/**
 * Geração e normalização de códigos de indicação do participante.
 * Spec: docs/modules/referrals.md
 */

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function buildReferralCode(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length]).join("");
}

/** Normaliza entrada do usuário/URL para lookup. */
export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type DbClient = Prisma.TransactionClient | typeof db;

export async function generateUniqueParticipantReferralCode(
  client: DbClient = db,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const referralCode = buildReferralCode();
    const [participant, guardian] = await Promise.all([
      client.participant.findUnique({ where: { referralCode }, select: { id: true } }),
      client.guardianProfile.findUnique({ where: { referralCode }, select: { id: true } }),
    ]);
    if (!participant && !guardian) return referralCode;
  }

  throw new Error("Não foi possível gerar código de indicação único.");
}

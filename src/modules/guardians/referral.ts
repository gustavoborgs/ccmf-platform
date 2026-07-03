import { randomBytes } from "node:crypto";
import { db } from "@/shared/db";

/**
 * Código de indicação do responsável — link público `/inscricao?indicacao=`.
 * Spec: docs/modules/guardians.md (referral)
 */

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function buildReferralCode(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length]).join("");
}

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const referralCode = buildReferralCode();
    const existing = await db.guardianProfile.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!existing) return referralCode;
  }

  throw new Error("Não foi possível gerar código de indicação único.");
}

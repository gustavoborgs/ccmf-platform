import "server-only";

import { auth } from "@/modules/auth/config";
import { db } from "@/shared/db";
import { parseWizardRef } from "./wizard-ref";

/**
 * Resolve o guardianId autorizado no fluxo de inscrição.
 * Prioridade: ref assinado da URL (validado no banco) → GUARDIAN logado.
 * Ref com guardian inexistente (ex.: banco resetado) é tratado como ausente.
 */
export async function resolveEnrollmentGuardianId(rawRef: string | null | undefined): Promise<string | null> {
  const ref = parseWizardRef(rawRef);
  if (ref) {
    const guardian = await db.guardianProfile.findUnique({
      where: { id: ref.guardianId },
      select: { id: true },
    });
    if (guardian) return guardian.id;
  }

  const session = await auth();
  if (session?.user?.role === "GUARDIAN") {
    const guardian = await db.guardianProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return guardian?.id ?? null;
  }

  return null;
}

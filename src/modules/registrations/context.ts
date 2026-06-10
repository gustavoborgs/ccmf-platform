import "server-only";

import { auth } from "@/modules/auth/config";
import { db } from "@/shared/db";
import { clearWizardSession, getWizardSession } from "./wizard-session";

/**
 * Resolve o guardianId autorizado no wizard de inscrição.
 * Prioridade: sessão autenticada (GUARDIAN) → cookie do wizard (validado no banco).
 * Cookie com guardian inexistente é descartado (ex.: banco resetado).
 */
export async function resolveEnrollmentGuardianId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role === "GUARDIAN") {
    const guardian = await db.guardianProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return guardian?.id ?? null;
  }

  const wizard = await getWizardSession();
  if (!wizard?.guardianId) return null;

  const guardian = await db.guardianProfile.findUnique({
    where: { id: wizard.guardianId },
    select: { id: true },
  });

  if (!guardian) {
    await clearWizardSession();
    return null;
  }

  return guardian.id;
}

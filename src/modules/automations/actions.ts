"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { updateAdminAutomation } from "./service";
import { adminAutomationUpdateSchema } from "./validators";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateAutomations(automationId?: string) {
  revalidatePath("/admin/automacoes");
  if (automationId) revalidatePath(`/admin/automacoes/${automationId}`);
}

export async function updateAutomationAction(
  automationId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = adminAutomationUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateAdminAutomation(automationId, parsed.data);
    revalidateAutomations(automationId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

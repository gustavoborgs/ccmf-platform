"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { updateAdminGuardian } from "./service";
import { adminGuardianUpdateSchema } from "./validators";

type ActionResult = { ok: true } | { ok: false; error: string };

function fail(error: unknown): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

export async function updateAdminGuardianAction(
  guardianId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = adminGuardianUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateAdminGuardian(guardianId, parsed.data);
    revalidatePath("/admin/responsaveis");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

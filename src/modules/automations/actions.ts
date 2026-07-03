"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import {
  createAdminAutomation,
  deleteAdminAutomation,
  updateAdminAutomation,
} from "./service";
import {
  adminAutomationCreateSchema,
  adminAutomationUpdateSchema,
} from "./validators";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAutomations(automationId?: string) {
  revalidatePath("/admin/automacoes");
  if (automationId) revalidatePath(`/admin/automacoes/${automationId}`);
}

export async function createAutomationAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  await requireRole("ADMIN");
  const parsed = adminAutomationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const automation = await createAdminAutomation(parsed.data);
    revalidateAutomations();
    return { ok: true, id: automation.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao criar automação." };
  }
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
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar." };
  }
}

export async function deleteAutomationAction(automationId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await deleteAdminAutomation(automationId);
    revalidateAutomations();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erro ao excluir." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { requestContestFrameUpload } from "@/modules/media/service";
import {
  createCategory,
  createContest,
  deleteCategory,
  moveCategory,
  updateCategory,
  updateContest,
  updateContestStatus,
} from "./service";
import {
  contestFrameUploadSchema,
  contestFormSchema,
  contestStatusUpdateSchema,
  createCategorySchema,
  moveCategorySchema,
  updateCategorySchema,
} from "./validators";

/**
 * Server Actions administrativas de edições e categorias.
 * Escrita restrita a ADMIN (docs/modules/contests.md).
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateContests(contestId?: string) {
  revalidatePath("/admin/concursos");
  if (contestId) revalidatePath(`/admin/concursos/${contestId}`);
}

// ── Edições ──────────────────────────────────────────────────────────

export async function createContestAction(
  input: unknown,
): Promise<ActionResult<{ contestId: string }>> {
  await requireRole("ADMIN");

  const parsed = contestFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const contest = await createContest(parsed.data);
    revalidateContests(contest.id);
    return { ok: true, data: { contestId: contest.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateContestAction(
  contestId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = contestFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateContest(contestId, parsed.data);
    revalidateContests(contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function requestContestFrameUploadAction(
  input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
  await requireRole("ADMIN");

  const parsed = contestFrameUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  try {
    const upload = await requestContestFrameUpload(parsed.data);
    return { ok: true, data: upload };
  } catch (error) {
    return fail(error);
  }
}

export async function updateContestStatusAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = contestStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Status inválido." };

  try {
    await updateContestStatus(parsed.data.contestId, parsed.data.status);
    revalidateContests(parsed.data.contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ── Categorias ───────────────────────────────────────────────────────

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createCategory(parsed.data.contestId, parsed.data.category);
    revalidateContests(parsed.data.contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCategoryAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const category = await updateCategory(parsed.data.categoryId, parsed.data.category);
    revalidateContests(category.contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const category = await deleteCategory(categoryId);
    revalidateContests(category.contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function moveCategoryAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = moveCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  try {
    const category = await moveCategory(parsed.data.categoryId, parsed.data.direction);
    revalidateContests(category.contestId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

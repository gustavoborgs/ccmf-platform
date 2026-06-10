"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { createVideo, deleteVideo, updateVideo } from "./service";
import { videoFormSchema } from "./validators";

/**
 * Server Actions administrativas do módulo Content.
 * Escrita restrita a ADMIN (docs/modules/content.md).
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateVideos(videoId?: string) {
  revalidatePath("/videos");
  revalidatePath("/admin/conteudo");
  if (videoId) revalidatePath(`/admin/conteudo/videos/${videoId}`);
}

export async function createVideoAction(input: unknown): Promise<ActionResult<{ videoId: string }>> {
  await requireRole("ADMIN");

  const parsed = videoFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const video = await createVideo(parsed.data);
    revalidateVideos(video.id);
    return { ok: true, data: { videoId: video.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateVideoAction(videoId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = videoFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateVideo(videoId, parsed.data);
    revalidateVideos(videoId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteVideoAction(videoId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await deleteVideo(videoId);
    revalidateVideos(videoId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

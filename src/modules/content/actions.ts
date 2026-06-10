"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { requestPartnerLogoUpload } from "@/modules/media/service";
import {
  createContactMessage,
  createPartner,
  createVideo,
  deletePartner,
  deleteVideo,
  updatePartner,
  updatePartnerLogo,
  updateVideo,
} from "./service";
import { contactFormSchema, partnerFormSchema, partnerLogoUploadSchema, videoFormSchema } from "./validators";

/**
 * Server Actions do módulo Content.
 * Vídeos: escrita restrita a ADMIN. Contato: público (docs/modules/content.md).
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateVideos(videoId?: string) {
  revalidatePath("/videos");
  revalidatePath("/admin/videos");
  if (videoId) revalidatePath(`/admin/videos/${videoId}`);
}

function revalidatePartners(partnerId?: string) {
  revalidatePath("/");
  revalidatePath("/admin/parceiros");
  if (partnerId) revalidatePath(`/admin/parceiros/${partnerId}`);
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

export async function createPartnerAction(input: unknown): Promise<ActionResult<{ partnerId: string }>> {
  await requireRole("ADMIN");

  const parsed = partnerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const partner = await createPartner(parsed.data);
    revalidatePartners(partner.id);
    return { ok: true, data: { partnerId: partner.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updatePartnerAction(partnerId: string, input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = partnerFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updatePartner(partnerId, parsed.data);
    revalidatePartners(partnerId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePartnerAction(partnerId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await deletePartner(partnerId);
    revalidatePartners(partnerId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function requestPartnerLogoUploadAction(
  input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
  await requireRole("ADMIN");

  const parsed = partnerLogoUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  try {
    const upload = await requestPartnerLogoUpload(parsed.data);
    return { ok: true, data: upload };
  } catch (error) {
    return fail(error);
  }
}

export async function updatePartnerLogoAction(
  partnerId: string,
  logoKey: string | null,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    await updatePartnerLogo(partnerId, logoKey);
    revalidatePartners(partnerId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createContactMessageAction(input: unknown): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createContactMessage(parsed.data);
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

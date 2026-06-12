"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireRole } from "@/modules/auth/guards";
import { removeRegistrationPhoto, requestPhotoUpload } from "@/modules/media/service";
import {
  buildLikeFingerprint,
  getAdminParticipantRegistration,
  likeRegistration,
  updateAdminParticipantStatus,
  type AdminParticipantRegistration,
} from "./service";
import {
  adminParticipantPhotoSchema,
  adminParticipantPhotoUploadSchema,
  adminParticipantRegistrationIdSchema,
  adminParticipantStatusSchema,
  likeInputSchema,
} from "./validators";

/**
 * Server Actions públicas do módulo Participants.
 * Like anônimo, sem login: deduplicado por fingerprint (ip + user-agent).
 * Spec: docs/modules/participants.md
 */

type LikeResult =
  | { ok: true; liked: boolean; likesCount: number }
  | { ok: false; error: string };

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateParticipantViews(year?: number, slug?: string) {
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/inscricoes");
  revalidatePath("/admin/responsaveis");
  revalidatePath("/participantes");
  if (year) revalidatePath(`/participantes/${year}`);
  if (year && slug) revalidatePath(`/participantes/${year}/${slug}`);
}

export async function getAdminParticipantRegistrationAction(
  input: unknown,
): Promise<ActionResult<AdminParticipantRegistration>> {
  await requireRole("ADMIN");

  const parsed = adminParticipantRegistrationIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inscrição inválida." };

  try {
    const registration = await getAdminParticipantRegistration(parsed.data.registrationId);
    if (!registration) return { ok: false, error: "Inscrição não encontrada." };
    return { ok: true, data: registration };
  } catch (error) {
    return fail(error);
  }
}

export async function likeRegistrationAction(input: unknown): Promise<LikeResult> {
  const parsed = likeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inscrição inválida." };

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const fingerprint = buildLikeFingerprint(ip, userAgent);

  try {
    const result = await likeRegistration(parsed.data.registrationId, fingerprint);
    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "Não foi possível registrar a curtida. Tente novamente." };
  }
}

export async function updateAdminParticipantStatusAction(
  input: unknown,
): Promise<ActionResult<{ status: string }>> {
  await requireRole("ADMIN");

  const parsed = adminParticipantStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  try {
    const registration = await updateAdminParticipantStatus(
      parsed.data.registrationId,
      parsed.data.status,
    );
    revalidateParticipantViews(registration.contest.year, registration.participant.slug);
    return { ok: true, data: { status: registration.status } };
  } catch (error) {
    return fail(error);
  }
}

export async function requestAdminParticipantPhotoUploadAction(
  input: unknown,
): Promise<ActionResult<{ photoId: string; uploadUrl: string }>> {
  await requireRole("ADMIN");

  const parsed = adminParticipantPhotoUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  try {
    const { photo, uploadUrl, registration } = await requestPhotoUpload(parsed.data);
    revalidateParticipantViews(registration.contest.year, registration.participant.slug);
    return { ok: true, data: { photoId: photo.id, uploadUrl } };
  } catch (error) {
    return fail(error);
  }
}

export async function removeAdminParticipantPhotoAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = adminParticipantPhotoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Foto inválida." };

  try {
    const result = await removeRegistrationPhoto(parsed.data.photoId);
    revalidateParticipantViews(result.contestYear, result.participantSlug);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

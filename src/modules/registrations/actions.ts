"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { captureLead } from "@/modules/leads/service";
import { requestPhotoUpload } from "@/modules/media/service";
import { getActiveContest } from "@/modules/contests/service";
import { resolveEnrollmentGuardianId } from "./context";
import {
  approveRegistration,
  checkCpfExists,
  createRegistration,
  ensureGuardian,
  linkGuardianByCpf,
  rejectRegistration,
  updateRegistrationParticipant,
} from "./service";
import {
  cpfSchema,
  guardianStep1Schema,
  participantSchema,
  photoUploadSchema,
  registrationRejectionSchema,
  registrationReviewSchema,
} from "./validators";
import { parseWizardRef, serializeWizardRef } from "./wizard-ref";

/**
 * Server Actions do wizard de inscrição (público).
 * Autorização: ref assinado da URL (?ref=) OU sessão de GUARDIAN logado.
 * Cada action que muda o estado devolve o ref atualizado para o client
 * sincronizar na URL. Spec: docs/modules/registrations.md
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  if (isStaleGuardianError(error)) {
    return {
      ok: false,
      error: "Sessão expirada ou inválida. Volte ao passo 1 e informe seu CPF novamente.",
    };
  }
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function isStaleGuardianError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  );
}

// ── Step 1 — Responsável ─────────────────────────────────────────────

export async function checkCpfAction(rawCpf: string): Promise<ActionResult<{ exists: boolean }>> {
  const parsed = cpfSchema.safeParse(rawCpf);
  if (!parsed.success) return { ok: false, error: "CPF inválido." };

  // Apenas o boolean — nunca dados do responsável (privacidade).
  const exists = await checkCpfExists(parsed.data);
  return { ok: true, data: { exists } };
}

/** Captura progressiva de lead (abandono pré-conta). Nunca falha o fluxo. */
export async function captureLeadAction(params: {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
}): Promise<void> {
  try {
    const cpf = params.cpf ? cpfSchema.safeParse(params.cpf).data : undefined;
    await captureLead({ ...params, cpf, source: "wizard" });
  } catch {
    // captura de lead é best-effort
  }
}

/** CPF existente → vincula sem autenticar e devolve o ref do wizard. */
export async function linkGuardianAction(rawCpf: string): Promise<ActionResult<{ ref: string }>> {
  const parsed = cpfSchema.safeParse(rawCpf);
  if (!parsed.success) return { ok: false, error: "CPF inválido." };

  const result = await linkGuardianByCpf(parsed.data);
  if (!result) return { ok: false, error: "CPF não encontrado. Faça seu cadastro." };

  return { ok: true, data: { ref: serializeWizardRef({ guardianId: result.guardianId }) } };
}

/** CPF novo → cria conta (senha obrigatória) e devolve o ref do wizard. */
export async function createGuardianAction(input: unknown): Promise<ActionResult<{ ref: string }>> {
  const parsed = guardianStep1Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (!parsed.data.password) {
    return { ok: false, error: "Crie uma senha para concluir seu cadastro." };
  }

  try {
    const result = await ensureGuardian(parsed.data);
    return { ok: true, data: { ref: serializeWizardRef({ guardianId: result.guardianId }) } };
  } catch (error) {
    return fail(error);
  }
}

// ── Step 2 — Participante + fotos ────────────────────────────────────

export async function createParticipantAction(
  rawRef: string | null,
  input: unknown,
): Promise<
  ActionResult<{
    ref: string;
    registrationId: string;
    protocol: string;
    categoryName: string;
    participantName: string;
  }>
> {
  const guardianId = await resolveEnrollmentGuardianId(rawRef);
  if (!guardianId) return { ok: false, error: "Referência inválida. Volte ao passo 1." };

  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const contest = await getActiveContest();
  if (!contest) return { ok: false, error: "As inscrições não estão abertas no momento." };

  try {
    const registration = await createRegistration({
      guardianId,
      contestId: contest.id,
      participant: parsed.data,
    });

    return {
      ok: true,
      data: {
        ref: serializeWizardRef({ guardianId, registrationId: registration.id }),
        registrationId: registration.id,
        protocol: registration.protocol,
        categoryName: registration.category.name,
        participantName: registration.participant.name,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateParticipantAction(
  rawRef: string | null,
  registrationId: string,
  input: unknown,
): Promise<
  ActionResult<{
    ref: string;
    registrationId: string;
    protocol: string;
    categoryName: string;
    participantName: string;
  }>
> {
  const ref = parseWizardRef(rawRef);
  if (!ref?.registrationId || ref.registrationId !== registrationId) {
    return { ok: false, error: "Referência inválida. Use seu link de retomada." };
  }

  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const registration = await updateRegistrationParticipant({
      guardianId: ref.guardianId,
      registrationId,
      participant: parsed.data,
    });

    return {
      ok: true,
      data: {
        ref: serializeWizardRef({ guardianId: ref.guardianId, registrationId: registration.id }),
        registrationId: registration.id,
        protocol: registration.protocol,
        categoryName: registration.category.name,
        participantName: registration.participant.name,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function requestPhotoUploadAction(
  rawRef: string | null,
  input: unknown,
): Promise<ActionResult<{ photoId: string; uploadUrl: string }>> {
  const parsed = photoUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  // Autorização: a inscrição precisa ser a do ref assinado da URL.
  const ref = parseWizardRef(rawRef);
  if (!ref?.registrationId || ref.registrationId !== parsed.data.registrationId) {
    return { ok: false, error: "Referência inválida. Use seu link de retomada." };
  }

  try {
    const { photo, uploadUrl } = await requestPhotoUpload(parsed.data);
    return { ok: true, data: { photoId: photo.id, uploadUrl } };
  } catch (error) {
    return fail(error);
  }
}

// ── Admin — Revisão de inscrições ────────────────────────────────────

function revalidateAdminRegistrationViews() {
  revalidatePath("/admin/inscricoes");
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/leads");
}

export async function approveRegistrationAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = registrationReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Inscrição inválida." };

  try {
    await approveRegistration(parsed.data.registrationId);
    revalidateAdminRegistrationViews();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function rejectRegistrationAction(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");

  const parsed = registrationRejectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await rejectRegistration(parsed.data.registrationId, parsed.data.rejectionReason);
    revalidateAdminRegistrationViews();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

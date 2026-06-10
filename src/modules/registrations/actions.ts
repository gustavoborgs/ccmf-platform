"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/config";
import { requireRole } from "@/modules/auth/guards";
import { captureLead } from "@/modules/leads/service";
import { requestPhotoUpload } from "@/modules/media/service";
import { getActiveContest } from "@/modules/contests/service";
import {
  approveRegistration,
  checkCpfExists,
  createRegistration,
  ensureGuardian,
  getGuardianByUserId,
  linkGuardianByCpf,
  rejectRegistration,
} from "./service";
import {
  cpfSchema,
  guardianStep1Schema,
  participantSchema,
  photoUploadSchema,
  registrationRejectionSchema,
  registrationReviewSchema,
} from "./validators";
import { getWizardSession, setWizardSession } from "./wizard-session";

/**
 * Server Actions do wizard de inscrição (público).
 * Autorização: cookie assinado do wizard OU sessão de GUARDIAN logado.
 * Spec: docs/modules/registrations.md
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

/** guardianId do fluxo atual: cookie do wizard, senão responsável logado. */
async function resolveGuardianId(): Promise<string | null> {
  const wizard = await getWizardSession();
  if (wizard?.guardianId) return wizard.guardianId;

  const session = await auth();
  if (session?.user?.role === "GUARDIAN") {
    const guardian = await getGuardianByUserId(session.user.id);
    return guardian?.id ?? null;
  }
  return null;
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

/** CPF existente → vincula sem autenticar e inicia a sessão do wizard. */
export async function linkGuardianAction(rawCpf: string): Promise<ActionResult> {
  const parsed = cpfSchema.safeParse(rawCpf);
  if (!parsed.success) return { ok: false, error: "CPF inválido." };

  const result = await linkGuardianByCpf(parsed.data);
  if (!result) return { ok: false, error: "CPF não encontrado. Faça seu cadastro." };

  await setWizardSession({ guardianId: result.guardianId });
  return { ok: true };
}

/** CPF novo → cria conta (senha obrigatória) e inicia a sessão do wizard. */
export async function createGuardianAction(input: unknown): Promise<ActionResult> {
  const parsed = guardianStep1Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (!parsed.data.password) {
    return { ok: false, error: "Crie uma senha para concluir seu cadastro." };
  }

  try {
    const result = await ensureGuardian(parsed.data);
    await setWizardSession({ guardianId: result.guardianId });
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ── Step 2 — Participante + fotos ────────────────────────────────────

export async function createParticipantAction(input: unknown): Promise<
  ActionResult<{
    registrationId: string;
    protocol: string;
    categoryName: string;
    participantName: string;
  }>
> {
  const guardianId = await resolveGuardianId();
  if (!guardianId) return { ok: false, error: "Sessão expirada. Volte ao passo 1." };

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

    await setWizardSession({ guardianId, registrationId: registration.id });

    return {
      ok: true,
      data: {
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

export async function requestPhotoUploadAction(input: unknown): Promise<
  ActionResult<{ photoId: string; uploadUrl: string }>
> {
  const parsed = photoUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  // Autorização: a inscrição precisa ser a da sessão do wizard.
  const wizard = await getWizardSession();
  if (!wizard?.registrationId || wizard.registrationId !== parsed.data.registrationId) {
    return { ok: false, error: "Sessão expirada. Use seu link de retomada." };
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

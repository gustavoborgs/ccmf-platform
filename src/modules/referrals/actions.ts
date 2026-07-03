"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { listAdminCampaigns, upsertCampaign } from "./service";
import { referralCampaignFormSchema } from "./validators";

/**
 * Server Actions administrativas de indicação.
 * Spec: docs/modules/referrals.md
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export async function upsertReferralCampaignAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");
    const parsed = referralCampaignFormSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const campaign = await upsertCampaign(parsed.data);
    revalidatePath("/admin/indicacoes");
    return { ok: true, data: { id: campaign.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao salvar campanha.",
    };
  }
}

export async function listReferralCampaignsAction() {
  await requireRole("ADMIN");
  return listAdminCampaigns();
}

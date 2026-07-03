import { z } from "zod";

/**
 * Schemas Zod do módulo referrals.
 * Spec: docs/modules/referrals.md
 */

export const referralCodeSchema = z
  .string()
  .trim()
  .min(6, "Código de indicação inválido.")
  .max(12, "Código de indicação inválido.")
  .regex(/^[A-Za-z0-9]+$/, "Código de indicação inválido.");

export const referralCampaignFormSchema = z
  .object({
    contestId: z.string().min(1, "Selecione a edição."),
    name: z.string().trim().min(3, "Nome obrigatório."),
    enabled: z.boolean(),
    rewardLikesCount: z.coerce.number().int().min(1).max(10_000),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return new Date(data.startsAt) <= new Date(data.endsAt);
    },
    { message: "A data de início deve ser anterior à data de fim.", path: ["endsAt"] },
  );

export type ReferralCampaignFormInput = z.infer<typeof referralCampaignFormSchema>;

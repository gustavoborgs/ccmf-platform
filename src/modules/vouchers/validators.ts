import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Schemas Zod do módulo Vouchers.
 * Spec: docs/modules/vouchers.md
 */

export const VOUCHER_CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

/** Normaliza código: trim + uppercase. */
export function normalizeVoucherCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const voucherCodeSchema = z
  .string({ message: "Informe o código do cupom." })
  .trim()
  .min(2, "Código muito curto.")
  .max(32, "Código muito longo.")
  .transform(normalizeVoucherCode)
  .pipe(z.string().regex(VOUCHER_CODE_REGEX, "Use letras, números, hífen ou underscore."));

export const optionalVoucherCodeSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .pipe(z.union([voucherCodeSchema, z.undefined()]));

export const VOUCHER_ACTIVE_FILTERS = ["all", "active", "inactive"] as const;

export const adminVoucherFiltersSchema = z.object({
  q: textParam,
  active: enumParam(VOUCHER_ACTIVE_FILTERS),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminVoucherFilters = z.infer<typeof adminVoucherFiltersSchema>;

export const voucherFormSchema = z
  .object({
    code: voucherCodeSchema,
    description: z
      .union([z.string().trim().max(280, "Descrição muito longa."), z.null(), z.literal("")])
      .optional()
      .transform((value) => {
        if (value == null || value === "") return null;
        return value;
      }),
    discountCents: z
      .number({ message: "Informe o desconto." })
      .int("Desconto inválido.")
      .positive("O desconto deve ser maior que zero.")
      .max(1_000_000, "Desconto muito alto."),
    unlimited: z.boolean(),
    maxUses: z
      .number()
      .int("Limite inválido.")
      .positive("O limite deve ser maior que zero.")
      .max(1_000_000)
      .nullable()
      .optional(),
    startsAt: z.coerce.date().nullable(),
    endsAt: z.coerce.date().nullable(),
    active: z.boolean(),
  })
  .superRefine((input, context) => {
    if (!input.unlimited && (input.maxUses == null || input.maxUses < 1)) {
      context.addIssue({
        code: "custom",
        path: ["maxUses"],
        message: "Informe o limite de usos ou marque como ilimitado.",
      });
    }
    if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "A data final deve ser posterior à inicial.",
      });
    }
  })
  .transform((input) => ({
    code: input.code,
    description: input.description ?? null,
    discountCents: input.discountCents,
    maxUses: input.unlimited ? null : (input.maxUses ?? null),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    active: input.active,
  }));

export type VoucherFormInput = z.infer<typeof voucherFormSchema>;

export const previewVoucherInputSchema = z.object({
  registrationId: z.string().min(1),
  code: voucherCodeSchema,
});

export type PreviewVoucherInput = z.infer<typeof previewVoucherInputSchema>;

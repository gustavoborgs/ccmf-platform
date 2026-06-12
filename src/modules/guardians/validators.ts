import { z } from "zod";
import { pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Filtros administrativos de responsáveis.
 * Spec: docs/modules/guardians.md
 */

export const adminGuardianFiltersSchema = z.object({
  q: textParam,
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminGuardianFilters = z.infer<typeof adminGuardianFiltersSchema>;

const nullableText = z
  .string()
  .trim()
  .transform((value) => value || null);

const nullableDigits = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, "") || null);

const nullableCpf = nullableDigits.pipe(
  z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos").nullable(),
);

const nullableCep = nullableDigits.pipe(
  z.string().regex(/^\d{8}$/, "CEP deve conter 8 dígitos").nullable(),
);

const nullableState = z
  .string()
  .trim()
  .toUpperCase()
  .transform((value) => value || null)
  .pipe(z.string().length(2, "Informe o UF com 2 letras").nullable());

export const adminGuardianUpdateSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome completo."),
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
    phone: nullableDigits,
    cpf: nullableCpf,
    whatsapp: nullableDigits,
    zipCode: nullableCep,
    street: nullableText,
    number: nullableText,
    complement: nullableText,
    neighborhood: nullableText,
    city: nullableText,
    state: nullableState,
    newPassword: z.string().optional().transform((value) => value?.trim() ?? ""),
    confirmPassword: z.string().optional().transform((value) => value?.trim() ?? ""),
  })
  .refine((value) => !value.newPassword || value.newPassword.length >= 8, {
    message: "A nova senha deve ter ao menos 8 caracteres.",
    path: ["newPassword"],
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type AdminGuardianUpdateInput = z.infer<typeof adminGuardianUpdateSchema>;

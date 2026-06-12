import { z } from "zod";

/**
 * Schemas de validação do módulo de autenticação.
 * Spec: docs/modules/auth.md
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  callbackUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/conta")),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Informe seu CPF ou e-mail do responsável.")
    .refine((value) => {
      const normalized = value.toLowerCase();
      const cpfDigits = value.replace(/\D/g, "");
      return normalized.includes("@")
        ? z.string().email().safeParse(normalized).success
        : cpfDigits.length === 11;
    }, "Informe um CPF com 11 dígitos ou um e-mail válido."),
});

export const passwordResetSchema = z
  .object({
    token: z.string().trim().min(32, "Link de recuperação inválido."),
    password: z.string().min(8, "Senha deve ter ao menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    callbackUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/conta")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

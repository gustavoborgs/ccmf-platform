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

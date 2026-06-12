import { z } from "zod";
import {
  enumParam,
  pageParam,
  pageSizeParam,
  positiveIntParam,
  textParam,
} from "@/shared/list-params";

/**
 * Schemas de validação do fluxo de inscrição.
 * Spec: docs/modules/registrations.md
 */

export const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"));

export const cepSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{8}$/, "CEP deve conter 8 dígitos"));

/** Endereço do responsável (preenchido via CEP + número/complemento). */
export const guardianAddressSchema = z.object({
  zipCode: cepSchema,
  street: z.string().min(3, "Informe o logradouro"),
  number: z.string().min(1, "Informe o número"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Informe o bairro"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "Informe o UF"),
});

/**
 * Step 1 do wizard — responsável (CPF-first).
 * `password` só é exigida quando o CPF ainda não existe (validado no service);
 * CPF existente apenas vincula a inscrição, sem autenticar.
 */
export const guardianStep1Schema = guardianAddressSchema.extend({
  name: z.string().min(3, "Informe o nome completo"),
  cpf: cpfSchema,
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").optional(),
});

export const participantSchema = z.object({
  name: z.string().min(3, "Informe o nome completo da criança"),
  birthDate: z.coerce.date().max(new Date(), "Data de nascimento inválida"),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  city: z.string().min(2),
  state: z.string().length(2),
  imageConsent: z.literal(true, {
    error: "É necessário aceitar o termo de uso de imagem",
  }),
});

export const photoUploadSchema = z.object({
  registrationId: z.string().cuid(),
  fileName: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  width: z.number().int().min(600, "Foto muito pequena (mínimo 600px de largura)"),
  height: z.number().int().min(800),
});

export type GuardianStep1Input = z.infer<typeof guardianStep1Schema>;
export type ParticipantInput = z.infer<typeof participantSchema>;

/** Filtros da fila administrativa de inscrições (`/admin/inscricoes`). */
export const REGISTRATION_STATUSES = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAID",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SEMIFINALIST",
  "WINNER",
] as const;

export const adminRegistrationFiltersSchema = z.object({
  q: textParam,
  year: positiveIntParam,
  categoryId: textParam,
  status: enumParam(REGISTRATION_STATUSES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminRegistrationFilters = z.infer<typeof adminRegistrationFiltersSchema>;

/** Revisão operacional da inscrição (admin). */
export const registrationReviewSchema = z.object({
  registrationId: z.string().cuid(),
});

/** Cancelamento da inscrição pelo responsável (`/conta`). */
export const guardianCancelRegistrationSchema = z.object({
  registrationId: z.string().cuid(),
});

/** Substituição de foto pelo responsável antes do pagamento confirmado. */
export const guardianPhotoReplaceSchema = z.object({
  photoId: z.string().cuid(),
  fileName: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  width: z.number().int().min(600, "Foto muito pequena (mínimo 600px de largura)"),
  height: z.number().int().min(800),
});

export const registrationRejectionSchema = registrationReviewSchema.extend({
  rejectionReason: z
    .string()
    .trim()
    .min(10, "Informe um motivo com pelo menos 10 caracteres.")
    .max(500, "Motivo muito longo."),
});

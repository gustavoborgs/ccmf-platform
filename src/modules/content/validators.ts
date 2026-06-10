import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";
import { extractYoutubeVideoId } from "./youtube";

/**
 * Schemas Zod do módulo Content.
 * Spec: docs/modules/content.md
 */

export const VIDEO_VISIBILITIES = ["published", "draft"] as const;
export const PARTNER_TYPES = ["MASTER", "MEDIA", "SPONSOR"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];
export const DEFAULT_PARTNER_TYPE: PartnerType = "SPONSOR";
export const PARTNER_VISIBILITIES = ["active", "inactive"] as const;

export const adminVideoFiltersSchema = z.object({
  q: textParam,
  visibility: enumParam(VIDEO_VISIBILITIES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminVideoFilters = z.infer<typeof adminVideoFiltersSchema>;

export const adminPartnerFiltersSchema = z.object({
  q: textParam,
  type: enumParam(PARTNER_TYPES),
  visibility: enumParam(PARTNER_VISIBILITIES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminPartnerFilters = z.infer<typeof adminPartnerFiltersSchema>;

export const videoFormSchema = z.object({
  title: z
    .string({ message: "Informe o título do vídeo." })
    .trim()
    .min(3, "O título precisa de pelo menos 3 caracteres.")
    .max(160, "Título muito longo."),
  youtubeUrl: z
    .string({ message: "Informe a URL do YouTube." })
    .trim()
    .min(1, "Informe a URL do YouTube.")
    .refine((value) => Boolean(extractYoutubeVideoId(value)), {
      message: "Informe uma URL válida do YouTube.",
    }),
  order: z
    .number({ message: "Informe a ordem de exibição." })
    .int("Ordem inválida.")
    .min(0, "A ordem não pode ser negativa.")
    .max(10_000, "Ordem muito alta."),
  published: z.boolean({ message: "Informe se o vídeo está publicado." }),
});

export type VideoFormInput = z.infer<typeof videoFormSchema>;

export const partnerFormSchema = z.object({
  name: z
    .string({ message: "Informe o nome do parceiro." })
    .trim()
    .min(2, "O nome precisa de pelo menos 2 caracteres.")
    .max(140, "Nome muito longo."),
  type: z.enum(PARTNER_TYPES, { message: "Informe o tipo do parceiro." }),
  logoKey: z
    .string()
    .trim()
    .min(1, "Chave do logo inválida.")
    .nullable(),
  url: z
    .string()
    .trim()
    .url("Informe uma URL válida.")
    .max(260, "URL muito longa.")
    .nullable(),
  order: z
    .number({ message: "Informe a ordem de exibição." })
    .int("Ordem inválida.")
    .min(0, "A ordem não pode ser negativa.")
    .max(10_000, "Ordem muito alta."),
  active: z.boolean({ message: "Informe se o parceiro está ativo." }),
});

export type PartnerFormInput = z.infer<typeof partnerFormSchema>;

export const partnerLogoUploadSchema = z.object({
  partnerId: z.string().min(1, "Parceiro inválido."),
  fileName: z.string().min(1, "Arquivo inválido."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "O logo deve ser JPG, PNG ou WebP.",
  }),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type PartnerLogoUploadInput = z.infer<typeof partnerLogoUploadSchema>;

export const contactFormSchema = z.object({
  name: z
    .string({ message: "Informe seu nome." })
    .trim()
    .min(3, "O nome precisa de pelo menos 3 caracteres.")
    .max(120, "Nome muito longo."),
  email: z
    .string({ message: "Informe seu e-mail." })
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(160, "E-mail muito longo."),
  phone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo.")
    .optional()
    .transform((value) => (value ? value : undefined)),
  message: z
    .string({ message: "Escreva sua mensagem." })
    .trim()
    .min(10, "A mensagem precisa de pelo menos 10 caracteres.")
    .max(2000, "A mensagem pode ter no máximo 2000 caracteres."),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

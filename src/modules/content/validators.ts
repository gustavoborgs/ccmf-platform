import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";
import { extractYoutubeVideoId } from "./youtube";

/**
 * Schemas Zod do módulo Content.
 * Spec: docs/modules/content.md
 */

export const VIDEO_VISIBILITIES = ["published", "draft"] as const;

export const adminVideoFiltersSchema = z.object({
  q: textParam,
  visibility: enumParam(VIDEO_VISIBILITIES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminVideoFilters = z.infer<typeof adminVideoFiltersSchema>;

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

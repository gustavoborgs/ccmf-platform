import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Schemas Zod do módulo Blog.
 * Spec: docs/modules/blog.md
 */

export const publicBlogFiltersSchema = z.object({
  q: textParam,
});

export type PublicBlogFilters = z.infer<typeof publicBlogFiltersSchema>;

export const BLOG_VISIBILITIES = ["published", "scheduled", "draft"] as const;

export const adminBlogFiltersSchema = z.object({
  q: textParam,
  visibility: enumParam(BLOG_VISIBILITIES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminBlogFilters = z.infer<typeof adminBlogFiltersSchema>;
export type BlogVisibility = (typeof BLOG_VISIBILITIES)[number];

export const blogPostFormSchema = z.object({
  title: z
    .string({ message: "Informe o título do post." })
    .trim()
    .min(3, "O título precisa de pelo menos 3 caracteres.")
    .max(180, "Título muito longo."),
  slug: z
    .string({ message: "Informe o slug." })
    .trim()
    .min(3, "O slug precisa de pelo menos 3 caracteres.")
    .max(180, "Slug muito longo.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  excerpt: z
    .string({ message: "Informe o resumo." })
    .trim()
    .min(10, "O resumo precisa de pelo menos 10 caracteres.")
    .max(260, "Resumo muito longo para SEO."),
  content: z
    .string({ message: "Informe o conteúdo." })
    .trim()
    .min(1, "Informe o conteúdo do post."),
  coverKey: z.string().trim().min(1).nullable(),
  publishedAt: z.date().nullable(),
}).superRefine((input, context) => {
  if (!input.publishedAt) return;

  if (input.excerpt.length < 20) {
    context.addIssue({
      code: "custom",
      path: ["excerpt"],
      message: "Para publicar, o resumo precisa de pelo menos 20 caracteres.",
    });
  }

  if (input.content.length < 80) {
    context.addIssue({
      code: "custom",
      path: ["content"],
      message: "Para publicar, o conteúdo precisa de pelo menos 80 caracteres.",
    });
  }
});

export type BlogPostFormInput = z.infer<typeof blogPostFormSchema>;

export const blogCoverUploadSchema = z.object({
  postId: z.string().min(1, "Post inválido."),
  fileName: z.string().min(1, "Arquivo inválido."),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "A capa deve ser JPG, PNG ou WebP.",
  }),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type BlogCoverUploadInput = z.infer<typeof blogCoverUploadSchema>;

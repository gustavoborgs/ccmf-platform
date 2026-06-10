import { db } from "@/shared/db";

/**
 * Módulo Content: blog, vídeos, parceiros/patrocinadores e contato.
 * Spec: docs/modules/content.md
 */

export function listPublishedPosts(limit?: number) {
  return db.blogPost.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export function getPostBySlug(slug: string) {
  return db.blogPost.findUnique({ where: { slug } });
}

export function listVideos() {
  return db.video.findMany({ where: { published: true }, orderBy: { order: "asc" } });
}

export function listPartnersByType() {
  return db.partner.findMany({
    where: { active: true },
    orderBy: [{ type: "asc" }, { order: "asc" }],
  });
}

export function createContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return db.contactMessage.create({ data });
}

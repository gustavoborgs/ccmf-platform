import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import type { AdminBlogFilters, BlogPostFormInput, PublicBlogFilters } from "./validators";

/**
 * Módulo Blog: leitura pública de posts, busca e dados para SEO.
 * Spec: docs/modules/blog.md
 */

const publicPostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverKey: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: { name: true } },
} satisfies Prisma.BlogPostSelect;

export type PublicBlogPost = Prisma.BlogPostGetPayload<{ select: typeof publicPostSelect }>;

const adminPostSelect = {
  ...publicPostSelect,
  authorId: true,
  createdAt: true,
} satisfies Prisma.BlogPostSelect;

export type AdminBlogPost = Prisma.BlogPostGetPayload<{ select: typeof adminPostSelect }>;

export function listPublishedPosts(filters: Partial<PublicBlogFilters> = {}) {
  return db.blogPost.findMany({
    where: buildPublishedPostWhere(filters),
    select: publicPostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function getPublishedPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: {
      slug,
      ...publishedPostWhere(),
    },
    select: publicPostSelect,
  });
}

export function listRecentPosts(limit: number, excludeSlug?: string) {
  return db.blogPost.findMany({
    where: {
      ...publishedPostWhere(),
      ...(excludeSlug ? { slug: { not: excludeSlug } } : {}),
    },
    select: publicPostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function listAdminBlogPosts(filters: AdminBlogFilters) {
  const where = buildAdminPostWhere(filters);
  const total = await db.blogPost.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.blogPost.findMany({
    where,
    select: adminPostSelect,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    skip,
    take: pagination.pageSize,
  });

  return { items, pagination };
}

export function getAdminBlogPostById(postId: string) {
  return db.blogPost.findUnique({ where: { id: postId }, select: adminPostSelect });
}

export async function createBlogPost(input: BlogPostFormInput, authorId: string) {
  await assertSlugIsAvailable(input.slug);

  return db.blogPost.create({
    data: normalizePostInput(input, authorId),
    select: adminPostSelect,
  });
}

export async function updateBlogPost(postId: string, input: BlogPostFormInput, authorId: string) {
  await assertPostExists(postId);
  await assertSlugIsAvailable(input.slug, postId);

  return db.blogPost.update({
    where: { id: postId },
    data: normalizePostInput(input, authorId),
    select: adminPostSelect,
  });
}

export async function deleteBlogPost(postId: string) {
  await assertPostExists(postId);
  return db.blogPost.delete({ where: { id: postId }, select: { id: true, slug: true } });
}

export async function updateBlogPostCover(postId: string, coverKey: string | null) {
  await assertPostExists(postId);
  return db.blogPost.update({
    where: { id: postId },
    data: { coverKey },
    select: { id: true, slug: true, coverKey: true },
  });
}

function buildPublishedPostWhere(filters: Partial<PublicBlogFilters>): Prisma.BlogPostWhereInput {
  const where = publishedPostWhere();

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
      { content: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildAdminPostWhere(filters: AdminBlogFilters): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {};
  const now = new Date();

  if (filters.visibility === "published") {
    where.publishedAt = { not: null, lte: now };
  } else if (filters.visibility === "scheduled") {
    where.publishedAt = { not: null, gt: now };
  } else if (filters.visibility === "draft") {
    where.publishedAt = null;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } },
      { excerpt: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

function publishedPostWhere(): Prisma.BlogPostWhereInput {
  return {
    publishedAt: {
      not: null,
      lte: new Date(),
    },
  };
}

function normalizePostInput(input: BlogPostFormInput, authorId: string): Prisma.BlogPostUncheckedCreateInput {
  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    coverKey: input.coverKey,
    publishedAt: input.publishedAt,
    authorId,
  };
}

async function assertPostExists(postId: string) {
  const post = await db.blogPost.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new Error("Post não encontrado.");
}

async function assertSlugIsAvailable(slug: string, currentPostId?: string) {
  const existing = await db.blogPost.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== currentPostId) {
    throw new Error("Já existe um post com este slug.");
  }
}

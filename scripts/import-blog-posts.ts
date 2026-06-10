import "dotenv/config";

import { readFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildBlogCoverKey, uploadObject } from "../src/shared/integrations/s3/storage";

type ImportedPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt: string | null;
  originalImageUrl: string | null;
  thumbnailUrl: string | null;
};

const BLOG_IMPORT_FILE = process.env.BLOG_IMPORT_FILE ?? "docs/blog-import/posts.json";
const BLOG_IMPORT_AUTHOR_EMAIL = process.env.BLOG_IMPORT_AUTHOR_EMAIL ?? "admin@ccmf.com.br";
const BLOG_IMPORT_UPLOAD_IMAGES = process.env.BLOG_IMPORT_UPLOAD_IMAGES !== "false";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  assertDatabaseUrl();

  const posts = await readPosts(BLOG_IMPORT_FILE);
  const author = await resolveAuthor(BLOG_IMPORT_AUTHOR_EMAIL);

  let created = 0;
  let updated = 0;
  let uploadedImages = 0;
  let skippedImages = 0;

  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug },
      select: { id: true },
    });

    const savedPost = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverKey: null,
        publishedAt: parsePublishedAt(post.publishedAt),
        authorId: author?.id,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        publishedAt: parsePublishedAt(post.publishedAt),
        authorId: author?.id,
      },
      select: { id: true, slug: true },
    });

    if (BLOG_IMPORT_UPLOAD_IMAGES) {
      const coverKey = await importCoverImage(savedPost.id, post);
      if (coverKey) {
        await prisma.blogPost.update({
          where: { id: savedPost.id },
          data: { coverKey },
          select: { id: true },
        });
        uploadedImages += 1;
      } else {
        skippedImages += 1;
      }
    }

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Importação concluída: ${created} criados, ${updated} atualizados.`);
  if (BLOG_IMPORT_UPLOAD_IMAGES) {
    console.log(`Capas: ${uploadedImages} enviadas ao storage, ${skippedImages} ignoradas.`);
  } else {
    console.log("Upload de capas desativado por BLOG_IMPORT_UPLOAD_IMAGES=false.");
  }
  if (!author) {
    console.log(`Aviso: autor não encontrado para ${BLOG_IMPORT_AUTHOR_EMAIL}; posts importados sem autor.`);
  }
}

function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }
}

async function readPosts(path: string): Promise<ImportedPost[]> {
  const raw = await readFile(path, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Arquivo inválido: ${path}`);
  }

  return parsed.map((post, index) => normalizePost(post, index));
}

function normalizePost(post: unknown, index: number): ImportedPost {
  if (!post || typeof post !== "object") {
    throw new Error(`Post inválido no índice ${index}.`);
  }

  const candidate = post as Record<string, unknown>;
  const title = assertString(candidate.title, "title", index);
  const slug = assertOriginalSlug(candidate.slug, index);
  const excerpt = assertString(candidate.excerpt, "excerpt", index);
  const content = assertString(candidate.content, "content", index);
  const publishedAt = candidate.publishedAt === null ? null : assertString(candidate.publishedAt, "publishedAt", index);
  const originalImageUrl =
    candidate.originalImageUrl === null ? null : assertString(candidate.originalImageUrl, "originalImageUrl", index);
  const thumbnailUrl =
    candidate.thumbnailUrl === null ? null : assertString(candidate.thumbnailUrl, "thumbnailUrl", index);

  return { title, slug, excerpt, content, publishedAt, originalImageUrl, thumbnailUrl };
}

function assertString(value: unknown, field: string, index: number) {
  if (typeof value !== "string") {
    throw new Error(`Campo ${field} inválido no post ${index}.`);
  }
  return value.trim();
}

function assertOriginalSlug(value: unknown, index: number) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Campo slug inválido no post ${index}.`);
  }
  return value;
}

function parsePublishedAt(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T12:00:00-03:00`);
}

async function importCoverImage(postId: string, post: ImportedPost) {
  const imageUrl = post.originalImageUrl ?? post.thumbnailUrl;
  if (!imageUrl) return null;

  const image = await downloadImage(imageUrl);
  const key = buildBlogCoverKey(postId, fileNameFromImageUrl(imageUrl, image.contentType));

  await uploadObject(key, image.body, image.contentType);
  return key;
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem ${url}: HTTP ${response.status}`);
  }

  const contentType = normalizeImageContentType(response.headers.get("content-type"), url);
  const body = new Uint8Array(await response.arrayBuffer());
  return { body, contentType };
}

function normalizeImageContentType(contentType: string | null, url: string) {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/png" || normalized === "image/webp") {
    return normalized;
  }

  const extension = extensionFromUrl(url);
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function fileNameFromImageUrl(url: string, contentType: string) {
  const pathname = new URL(url).pathname;
  const fileName = pathname.split("/").pop();
  if (fileName && fileName.includes(".")) return fileName;

  if (contentType === "image/png") return "cover.png";
  if (contentType === "image/webp") return "cover.webp";
  return "cover.jpg";
}

function extensionFromUrl(url: string) {
  return new URL(url).pathname.split(".").pop()?.toLowerCase();
}

async function resolveAuthor(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

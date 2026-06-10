"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth/guards";
import { requestBlogCoverUpload } from "@/modules/media/service";
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  updateBlogPostCover,
} from "./service";
import { blogCoverUploadSchema, blogPostFormSchema } from "./validators";

/**
 * Server Actions administrativas do módulo Blog.
 * Escrita restrita a ADMIN (docs/modules/blog.md).
 */

type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : "Erro inesperado." };
}

function revalidateBlog(postId?: string, slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/sitemap.xml");
  if (postId) revalidatePath(`/admin/blog/${postId}`);
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function createBlogPostAction(
  input: unknown,
): Promise<ActionResult<{ postId: string; slug: string }>> {
  const user = await requireRole("ADMIN");

  const parsed = blogPostFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const post = await createBlogPost(parsed.data, user.id);
    revalidateBlog(post.id, post.slug);
    return { ok: true, data: { postId: post.id, slug: post.slug } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateBlogPostAction(postId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = blogPostFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const post = await updateBlogPost(postId, parsed.data, user.id);
    revalidateBlog(post.id, post.slug);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteBlogPostAction(postId: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const post = await deleteBlogPost(postId);
    revalidateBlog(post.id, post.slug);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function requestBlogCoverUploadAction(
  input: unknown,
): Promise<ActionResult<{ key: string; uploadUrl: string }>> {
  await requireRole("ADMIN");

  const parsed = blogCoverUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  try {
    const upload = await requestBlogCoverUpload(parsed.data);
    return { ok: true, data: upload };
  } catch (error) {
    return fail(error);
  }
}

export async function updateBlogPostCoverAction(
  postId: string,
  coverKey: string | null,
): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const post = await updateBlogPostCover(postId, coverKey);
    revalidateBlog(post.id, post.slug);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

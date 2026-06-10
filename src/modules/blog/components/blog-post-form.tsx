"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { Button, Field, TextInput, cn } from "@/shared/ui";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  requestBlogCoverUploadAction,
  updateBlogPostAction,
  updateBlogPostCoverAction,
} from "../actions";
import { estimateReadingMinutes } from "../format";

const ImageCropper = dynamic(
  () => import("@/shared/ui/image-cropper").then((mod) => ({ default: mod.ImageCropper })),
  { ssr: false },
);

export type BlogPostFormInitial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverKey: string | null;
  coverUrl?: string | null;
  publishedAt: Date | null;
};

type Visibility = "draft" | "published" | "scheduled";
type CoverUpload = {
  blob: Blob;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
};

export function BlogPostForm({ initial }: { initial?: BlogPostFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverKey, setCoverKey] = useState(initial?.coverKey ?? "");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(initial?.coverUrl ?? "");
  const [coverUpload, setCoverUpload] = useState<CoverUpload | null>(null);
  const [croppingCoverSrc, setCroppingCoverSrc] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(visibilityFromDate(initial?.publishedAt ?? null));
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(initial?.publishedAt ?? null));

  const readingMinutes = useMemo(() => estimateReadingMinutes(content), [content]);

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugTouched) setSlug(slugify(nextTitle));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const publishedAt = resolvePublishedAt();
    if (publishedAt === "invalid") {
      setError("Informe uma data futura para agendar a publicação.");
      return;
    }

    startTransition(async () => {
      try {
        let postId = initial?.id;
        let finalCoverKey = coverKey.trim() || null;
        const basePayload = {
          title,
          slug,
          excerpt,
          content,
          coverKey: finalCoverKey,
          publishedAt,
        };

        if (!postId) {
          const created = await createBlogPostAction({ ...basePayload, coverKey: null });
          if (!created.ok) {
            setError(created.error);
            return;
          }
          postId = created.data.postId;
        }

        if (coverUpload) {
          finalCoverKey = await uploadCover(postId, coverUpload);
        }

        const result = initial
          ? await updateBlogPostAction(postId, { ...basePayload, coverKey: finalCoverKey })
          : await updateBlogPostAction(postId, { ...basePayload, coverKey: finalCoverKey });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        if (!initial) {
          router.push(`/admin/blog/${postId}`);
          return;
        }

        setCoverUpload(null);
        setCoverKey(finalCoverKey ?? "");
        setSuccess(true);
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Erro ao salvar o post.");
      }
    });
  }

  async function uploadCover(postId: string, cover: CoverUpload) {
    setIsUploadingCover(true);
    try {
      const action = await requestBlogCoverUploadAction({
        postId,
        fileName: cover.fileName,
        contentType: cover.contentType,
        width: cover.width,
        height: cover.height,
      });
      if (!action.ok) throw new Error(action.error);

      const put = await fetch(action.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": cover.contentType },
        body: cover.blob,
      });
      if (!put.ok) throw new Error("Falha no envio da capa. Tente novamente.");

      await updateBlogPostCoverAction(postId, action.data.key);
      return action.data.key;
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleDelete() {
    if (!initial) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await deleteBlogPostAction(initial.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/blog");
    });
  }

  function resolvePublishedAt(): Date | null | "invalid" {
    if (visibility === "draft") return null;
    if (visibility === "published") {
      return initial?.publishedAt && initial.publishedAt <= new Date() ? initial.publishedAt : new Date();
    }

    if (!scheduledAt) return "invalid";
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime()) || date <= new Date()) return "invalid";
    return date;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Field label="Título" hint="Use um título claro, com a palavra-chave principal no começo.">
          <TextInput
            required
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            disabled={isPending}
            placeholder="Como preparar a criança para uma sessão de fotos"
          />
        </Field>

        <Field label="Slug" hint="URL do post. Ex.: dicas-foto-infantil">
          <TextInput
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            disabled={isPending}
            placeholder="dicas-foto-infantil"
          />
        </Field>

        <Field
          label="Resumo SEO"
          hint={`${excerpt.length}/260 caracteres. Aparece na listagem, Google e compartilhamentos.`}
        >
          <textarea
            required
            rows={3}
            maxLength={260}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            disabled={isPending}
            placeholder="Um resumo direto sobre o que o responsável vai aprender neste artigo."
            className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-60"
          />
        </Field>

        <Field label="Conteúdo em Markdown" hint={`${readingMinutes} min de leitura estimado.`}>
          <textarea
            required
            rows={18}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isPending}
            placeholder={"## Introdução\n\nEscreva o conteúdo do post aqui..."}
            className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-60"
          />
        </Field>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-bubble border border-primary-100 bg-white p-5 shadow-brand">
          <h2 className="font-display text-lg font-extrabold text-primary-700">Publicação</h2>
          <div className="mt-4 space-y-2">
            <VisibilityOption
              value="draft"
              current={visibility}
              onChange={setVisibility}
              title="Rascunho"
              description="Não aparece no site público."
            />
            <VisibilityOption
              value="published"
              current={visibility}
              onChange={setVisibility}
              title="Publicar agora"
              description="Aparece no blog e no sitemap."
            />
            <VisibilityOption
              value="scheduled"
              current={visibility}
              onChange={setVisibility}
              title="Agendar"
              description="Fica oculto até a data escolhida."
            />
          </div>

          {visibility === "scheduled" && (
            <Field label="Data de publicação" className="mt-4">
              <TextInput
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                disabled={isPending}
              />
            </Field>
          )}
        </section>

        <section className="rounded-bubble border border-primary-100 bg-white p-5 shadow-brand">
          <h2 className="font-display text-lg font-extrabold text-primary-700">Capa</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
            {coverPreviewUrl ? (
              <>
                {/* preview local/CDN da capa; next/image não se aplica para object URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreviewUrl} alt="Prévia da capa" className="aspect-[16/10] w-full object-cover" />
              </>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center font-display text-3xl font-extrabold text-primary-200">
                CCMF
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Use JPG, PNG ou WebP com pelo menos 900x500px. A imagem aparece no card, no post e no
            compartilhamento.
          </p>
          {coverKey && <p className="mt-2 break-all text-xs text-ink-muted">{coverKey}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={isPending || isUploadingCover}
            >
              {coverPreviewUrl ? "Trocar capa" : "Enviar capa"}
            </Button>
            {(coverPreviewUrl || coverKey) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCoverUpload(null);
                  setCoverKey("");
                  setCoverPreviewUrl("");
                }}
                disabled={isPending || isUploadingCover}
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setCroppingCoverSrc(String(reader.result));
                reader.readAsDataURL(file);
              }
              event.target.value = "";
            }}
          />
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Post salvo com sucesso.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button type="submit" disabled={isPending || isUploadingCover} className="w-full">
            {isPending || isUploadingCover ? "Salvando..." : initial ? "Salvar alterações" : "Criar post"}
          </Button>
          {initial && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isUploadingCover}
              onClick={() => {
                if (window.confirm("Excluir este post?")) handleDelete();
              }}
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
            >
              Excluir post
            </Button>
          )}
        </div>
      </aside>

      {croppingCoverSrc && (
        <ImageCropper
          imageSrc={croppingCoverSrc}
          aspect={16 / 10}
          title="Ajuste a capa (16:10)"
          frameClassName="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-ink"
          confirmLabel="Usar esta capa"
          output={{ maxWidth: 1600, maxHeight: 1000, mimeType: "image/jpeg", quality: 0.9 }}
          onCancel={() => setCroppingCoverSrc(null)}
          onConfirm={(result) => {
            setCroppingCoverSrc(null);
            setCoverUpload({
              blob: result.blob,
              fileName: "cover.jpg",
              contentType: "image/jpeg",
              width: result.width,
              height: result.height,
            });
            setCoverPreviewUrl(URL.createObjectURL(result.blob));
            setCoverKey("");
          }}
        />
      )}
    </form>
  );
}

function VisibilityOption({
  value,
  current,
  onChange,
  title,
  description,
}: {
  value: Visibility;
  current: Visibility;
  onChange: (visibility: Visibility) => void;
  title: string;
  description: string;
}) {
  const selected = value === current;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left transition",
        selected
          ? "border-accent-500 bg-accent-50 text-accent-800"
          : "border-primary-100 text-ink hover:bg-primary-50",
      )}
    >
      <span className="block text-sm font-extrabold">{title}</span>
      <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>
    </button>
  );
}

function visibilityFromDate(date: Date | null): Visibility {
  if (!date) return "draft";
  return date > new Date() ? "scheduled" : "published";
}

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}


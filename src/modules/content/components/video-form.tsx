"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/shared/ui";
import { createVideoAction, deleteVideoAction, updateVideoAction } from "../actions";

export type VideoFormInitial = {
  id: string;
  title: string;
  youtubeUrl: string;
  order: number;
  published: boolean;
};

export function VideoForm({ initial }: { initial?: VideoFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [published, setPublished] = useState(initial?.published ?? true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedOrder = Number(order);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      setError("Ordem inválida. Use um número inteiro maior ou igual a zero.");
      return;
    }

    const payload = {
      title,
      youtubeUrl,
      order: parsedOrder,
      published,
    };

    startTransition(async () => {
      const result = initial
        ? await updateVideoAction(initial.id, payload)
        : await createVideoAction(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (!initial && result.data) {
        router.push(`/admin/videos/${result.data.videoId}`);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await deleteVideoAction(initial.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/videos");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Título">
        <TextInput
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isPending}
          placeholder="Chamada do Concurso Criança Mais Fotogênica"
        />
      </Field>

      <Field
        label="URL do YouTube"
        hint="Aceita links como https://www.youtube.com/watch?v=PDkP0CFsadY ou https://youtu.be/PDkP0CFsadY."
      >
        <TextInput
          required
          type="url"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          disabled={isPending}
          placeholder="https://www.youtube.com/watch?v=PDkP0CFsadY"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <Field label="Ordem" hint="Menor número aparece primeiro.">
          <TextInput
            required
            type="number"
            min={0}
            step={1}
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            disabled={isPending}
          />
        </Field>

        <label className="flex items-center gap-3 self-start rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            disabled={isPending}
            className="h-5 w-5 rounded border-primary-300 text-accent-600"
          />
          <span>
            <span className="block text-sm font-bold text-ink">Publicado</span>
            <span className="block text-xs text-ink-muted">
              Quando marcado, aparece na página pública de vídeos.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Vídeo salvo com sucesso.
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {initial && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              if (window.confirm("Excluir este vídeo?")) handleDelete();
            }}
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            Excluir vídeo
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : initial ? "Salvar alterações" : "Criar vídeo"}
        </Button>
      </div>
    </form>
  );
}

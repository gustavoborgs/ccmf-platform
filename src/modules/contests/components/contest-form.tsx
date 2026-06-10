"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/shared/ui";
import {
  createContestAction,
  requestContestFrameUploadAction,
  updateContestAction,
} from "../actions";

export type ContestFormInitial = {
  id: string;
  year: number;
  name: string;
  registrationFeeCents: number;
  revealAt: Date | null;
  frameImageKey: string | null;
  frameImageUrl?: string | null;
  regulationMd: string | null;
};

/**
 * Formulário de criação/edição de uma edição do concurso.
 * Dinheiro é digitado em reais e convertido para centavos na borda (aqui).
 */
export function ContestForm({ initial }: { initial?: ContestFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);

  const [year, setYear] = useState(initial ? String(initial.year) : String(new Date().getFullYear()));
  const [name, setName] = useState(initial?.name ?? "");
  const [fee, setFee] = useState(initial ? centsToInput(initial.registrationFeeCents) : "");
  const [revealAt, setRevealAt] = useState(toLocalInputValue(initial?.revealAt ?? null));
  const [frameImageKey, setFrameImageKey] = useState(initial?.frameImageKey ?? "");
  const [framePreviewUrl, setFramePreviewUrl] = useState(initial?.frameImageUrl ?? "");
  const [regulationMd, setRegulationMd] = useState(initial?.regulationMd ?? "");
  const frameInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const feeCents = parseBRLToCents(fee);
    if (feeCents === null) {
      setError("Taxa de inscrição inválida. Use o formato 60,00.");
      return;
    }

    const payload = {
      year: Number(year),
      name,
      registrationFeeCents: feeCents,
      revealAt: revealAt ? new Date(revealAt) : null,
      frameImageKey: frameImageKey.trim() || null,
      regulationMd: regulationMd.trim() || null,
    };

    startTransition(async () => {
      const result = initial
        ? await updateContestAction(initial.id, payload)
        : await createContestAction(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (!initial && result.data) {
        router.push(`/admin/concursos/${result.data.contestId}`);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  async function handleFrameFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(false);

    const contestYear = Number(year);
    if (!Number.isInteger(contestYear) || contestYear < 2000 || contestYear > 2100) {
      setError("Informe um ano válido antes de enviar a moldura.");
      return;
    }
    if (file.type !== "image/png") {
      setError("A moldura deve ser um arquivo PNG transparente.");
      return;
    }

    setIsUploadingFrame(true);
    try {
      const dimensions = await readImageDimensions(file);
      const action = await requestContestFrameUploadAction({
        contestYear,
        fileName: file.name,
        contentType: file.type,
        width: dimensions.width,
        height: dimensions.height,
      });
      if (!action.ok) throw new Error(action.error);

      const put = await fetch(action.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Falha no envio da moldura. Tente novamente.");

      setFrameImageKey(action.data.key);
      setFramePreviewUrl(URL.createObjectURL(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro no envio da moldura.");
    } finally {
      setIsUploadingFrame(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
        <Field label="Ano">
          <TextInput
            type="number"
            min={2000}
            max={2100}
            required
            value={year}
            onChange={(event) => setYear(event.target.value)}
            disabled={isPending}
          />
        </Field>
        <Field label="Nome da edição" hint="Ex.: Concurso Criança Mais Formosa 2026">
          <TextInput
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            placeholder="Concurso Criança Mais Formosa 2026"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Taxa de inscrição (R$)" hint="Guardada em centavos no banco.">
          <TextInput
            required
            inputMode="decimal"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            disabled={isPending}
            placeholder="60,00"
          />
        </Field>
        <Field label="Data da live de resultados" hint="Opcional — pode ser definida depois.">
          <TextInput
            type="datetime-local"
            value={revealAt}
            onChange={(event) => setRevealAt(event.target.value)}
            disabled={isPending}
          />
        </Field>
      </div>

      <div className="block">
        <span className="mb-1.5 block text-sm font-bold text-ink">Moldura dos aprovados</span>
        <div className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
          {framePreviewUrl ? (
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative aspect-[3/4] w-28 overflow-hidden rounded-2xl border border-primary-200 bg-white">
                {/* preview local/CDN da moldura; next/image não se aplica para object URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={framePreviewUrl} alt="Prévia da moldura" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-primary-700">Moldura anexada</p>
                <p className="break-all text-xs text-ink-muted">{frameImageKey}</p>
              </div>
            </div>
          ) : frameImageKey ? (
            <p className="break-all text-sm text-ink-muted">Moldura anexada: {frameImageKey}</p>
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma moldura anexada.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => frameInputRef.current?.click()}
              disabled={isPending || isUploadingFrame}
            >
              {isUploadingFrame ? "Enviando..." : frameImageKey ? "Trocar moldura" : "Enviar moldura"}
            </Button>
            {frameImageKey && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFrameImageKey("");
                  setFramePreviewUrl("");
                }}
                disabled={isPending || isUploadingFrame}
              >
                Remover anexo
              </Button>
            )}
          </div>

          <input
            ref={frameInputRef}
            type="file"
            accept="image/png"
            hidden
            onChange={(event) => {
              void handleFrameFileSelected(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <span className="mt-1 block text-xs text-ink-muted">
          PNG transparente em retrato 3:4, com pelo menos 600px de largura. O arquivo é enviado direto
          ao S3.
        </span>
      </div>

      <Field
        label="Regulamento (Markdown)"
        hint="Renderizado na página pública /regulamento quando a edição estiver ativa."
      >
        <textarea
          value={regulationMd}
          onChange={(event) => setRegulationMd(event.target.value)}
          disabled={isPending}
          rows={10}
          placeholder="# Regulamento&#10;&#10;1. Podem participar crianças..."
          className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-60"
        />
      </Field>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Edição salva com sucesso.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : initial ? "Salvar alterações" : "Criar edição"}
        </Button>
      </div>
    </form>
  );
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Aceita "60", "60,00", "1.250,50" e "60.00". */
function parseBRLToCents(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler as dimensões da moldura."));
    };
    image.src = objectUrl;
  });
}

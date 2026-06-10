"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { PARTNER_LOGO_SIZE } from "@/shared/utils";
import { Button, Field, SelectInput, TextInput } from "@/shared/ui";
import {
  createPartnerAction,
  deletePartnerAction,
  requestPartnerLogoUploadAction,
  updatePartnerAction,
  updatePartnerLogoAction,
} from "../actions";
import {
  DEFAULT_PARTNER_TYPE,
  PARTNER_TYPES,
  type PartnerType,
} from "../validators";

const ImageCropper = dynamic(
  () => import("@/shared/ui/image-cropper").then((mod) => ({ default: mod.ImageCropper })),
  { ssr: false },
);

export type PartnerFormInitial = {
  id: string;
  name: string;
  type: PartnerType;
  logoKey: string | null;
  logoUrl?: string | null;
  url: string | null;
  order: number;
  active: boolean;
};

type LogoUpload = {
  blob: Blob;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
};

const partnerTypeLabels: Record<PartnerType, string> = {
  MASTER: "Parceiro master",
  MEDIA: "Veículo de comunicação",
  SPONSOR: "Patrocinador",
};

export function PartnerForm({ initial }: { initial?: PartnerFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<PartnerType>(initial?.type ?? DEFAULT_PARTNER_TYPE);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [order, setOrder] = useState(initial ? String(initial.order) : "0");
  const [active, setActive] = useState(initial?.active ?? true);
  const [logoKey, setLogoKey] = useState(initial?.logoKey ?? "");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(initial?.logoUrl ?? "");
  const [logoUpload, setLogoUpload] = useState<LogoUpload | null>(null);
  const [croppingLogoSrc, setCroppingLogoSrc] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedOrder = Number(order);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      setError("Ordem inválida. Use um número inteiro maior ou igual a zero.");
      return;
    }

    startTransition(async () => {
      try {
        let partnerId = initial?.id;
        let finalLogoKey = logoKey.trim() || null;
        const payload = {
          name,
          type,
          logoKey: finalLogoKey,
          url: url.trim() || null,
          order: parsedOrder,
          active,
        };

        if (!partnerId) {
          const created = await createPartnerAction({ ...payload, logoKey: null });
          if (!created.ok) {
            setError(created.error);
            return;
          }
          partnerId = created.data.partnerId;
        }

        if (logoUpload) {
          finalLogoKey = await uploadLogo(partnerId, logoUpload);
        }

        const result = await updatePartnerAction(partnerId, { ...payload, logoKey: finalLogoKey });
        if (!result.ok) {
          setError(result.error);
          return;
        }

        if (!initial) {
          router.push(`/admin/parceiros/${partnerId}`);
          return;
        }

        setLogoUpload(null);
        setLogoKey(finalLogoKey ?? "");
        setSuccess(true);
        router.refresh();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Erro ao salvar o parceiro.");
      }
    });
  }

  async function uploadLogo(partnerId: string, logo: LogoUpload) {
    setIsUploadingLogo(true);
    try {
      const action = await requestPartnerLogoUploadAction({
        partnerId,
        fileName: logo.fileName,
        contentType: logo.contentType,
        width: logo.width,
        height: logo.height,
      });
      if (!action.ok) throw new Error(action.error);

      const put = await fetch(action.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": logo.contentType },
        body: logo.blob,
      });
      if (!put.ok) throw new Error("Falha no envio do logo. Tente novamente.");

      await updatePartnerLogoAction(partnerId, action.data.key);
      return action.data.key;
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function handleDelete() {
    if (!initial) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await deletePartnerAction(initial.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/parceiros");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Field label="Nome">
          <TextInput
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            placeholder="Nome da marca parceira"
          />
        </Field>

        <Field label="Tipo">
          <SelectInput
            required
            value={type}
            onChange={(event) => setType(event.target.value as PartnerType)}
            disabled={isPending}
          >
            {PARTNER_TYPES.map((partnerType) => (
              <option key={partnerType} value={partnerType}>
                {partnerTypeLabels[partnerType]}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="URL" hint="Opcional. Quando preenchida, o logo abre em nova aba.">
          <TextInput
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={isPending}
            placeholder="https://marca.com.br"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <Field label="Ordem" hint="Menor número aparece primeiro dentro do tipo.">
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
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              disabled={isPending}
              className="h-5 w-5 rounded border-primary-300 text-accent-600"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Ativo</span>
              <span className="block text-xs text-ink-muted">
                Quando marcado, aparece nas vitrines públicas da home.
              </span>
            </span>
          </label>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-bubble border border-primary-100 bg-white p-5 shadow-brand">
          <h2 className="font-display text-lg font-extrabold text-primary-700">Logo</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
            {logoPreviewUrl ? (
              // preview local/CDN do logo; next/image não se aplica para object URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreviewUrl} alt="Prévia do logo" className="aspect-[2/1] w-full object-contain p-4" />
            ) : (
              <div className="flex aspect-[2/1] items-center justify-center font-display text-3xl font-extrabold text-primary-200">
                Logo
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            O recorte gera sempre {PARTNER_LOGO_SIZE.width}x{PARTNER_LOGO_SIZE.height}px, no formato 2:1.
          </p>
          {logoKey && <p className="mt-2 break-all text-xs text-ink-muted">{logoKey}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isPending || isUploadingLogo}
            >
              {logoPreviewUrl ? "Trocar logo" : "Enviar logo"}
            </Button>
            {(logoPreviewUrl || logoKey) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogoUpload(null);
                  setLogoKey("");
                  setLogoPreviewUrl("");
                }}
                disabled={isPending || isUploadingLogo}
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setCroppingLogoSrc(String(reader.result));
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
            Parceiro salvo com sucesso.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button type="submit" disabled={isPending || isUploadingLogo} className="w-full">
            {isPending || isUploadingLogo ? "Salvando..." : initial ? "Salvar alterações" : "Criar parceiro"}
          </Button>
          {initial && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending || isUploadingLogo}
              onClick={() => {
                if (window.confirm("Excluir este parceiro?")) handleDelete();
              }}
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
            >
              Excluir parceiro
            </Button>
          )}
        </div>
      </aside>

      {croppingLogoSrc && (
        <ImageCropper
          imageSrc={croppingLogoSrc}
          aspect={2 / 1}
          title="Ajuste o logo (800x400)"
          frameClassName="relative mt-4 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-ink"
          confirmLabel="Usar este logo"
          output={{
            targetWidth: PARTNER_LOGO_SIZE.width,
            targetHeight: PARTNER_LOGO_SIZE.height,
            mimeType: "image/jpeg",
            quality: 0.92,
          }}
          onCancel={() => setCroppingLogoSrc(null)}
          onConfirm={(result) => {
            setCroppingLogoSrc(null);
            setLogoUpload({
              blob: result.blob,
              fileName: "logo.jpg",
              contentType: "image/jpeg",
              width: result.width,
              height: result.height,
            });
            setLogoPreviewUrl(URL.createObjectURL(result.blob));
            setLogoKey("");
          }}
        />
      )}
    </form>
  );
}

"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  removeAdminParticipantPhotoAction,
  requestAdminParticipantPhotoUploadAction,
  updateAdminParticipantStatusAction,
} from "@/modules/participants/actions";
import { Button, Field, SelectInput } from "@/shared/ui";

const ImageCropper = dynamic(
  () => import("@/shared/ui/image-cropper").then((mod) => ({ default: mod.ImageCropper })),
  { ssr: false },
);

type StatusOption = {
  value: string;
  label: string;
};

type AdminPhoto = {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

const MAX_PHOTOS = 2;

export function AdminParticipantStatusControl({
  registrationId,
  currentStatus,
  options,
}: {
  registrationId: string;
  currentStatus: string;
  options: StatusOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function saveStatus() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminParticipantStatusAction({ registrationId, status });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus(result.data.status);
      setMessage("Status atualizado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Field label="Status da inscrição">
        <SelectInput
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={isPending}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={saveStatus} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar status"}
        </Button>
        {message && <p className="text-sm font-semibold text-green-700">{message}</p>}
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}

export function AdminParticipantPhotoManager({
  registrationId,
  photos,
}: {
  registrationId: string;
  photos: AdminPhoto[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [cropping, setCropping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAddPhoto = photos.length < MAX_PHOTOS;

  function selectFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCropping(String(reader.result));
    reader.onerror = () => setError("Não foi possível abrir a imagem.");
    reader.readAsDataURL(file);
  }

  function uploadCropped(result: { blob: Blob; width: number; height: number }) {
    setCropping(null);
    setError(null);
    startTransition(async () => {
      const action = await requestAdminParticipantPhotoUploadAction({
        registrationId,
        fileName: `foto-admin-${Date.now()}.jpg`,
        contentType: "image/jpeg",
        width: result.width,
        height: result.height,
      });
      if (!action.ok) {
        setError(action.error);
        return;
      }

      const put = await fetch(action.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: result.blob,
      });
      if (!put.ok) {
        setError("Falha no envio da foto. Tente novamente.");
        return;
      }

      router.refresh();
    });
  }

  function removePhoto(photoId: string) {
    if (!window.confirm("Remover esta foto do participante?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeAdminParticipantPhotoAction({ photoId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="space-y-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
                <Image
                  src={photo.url}
                  alt={`Foto ${photo.order + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-primary-700">
                  {photo.order + 1}
                </span>
                {photo.isCover && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    Capa
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                disabled={isPending}
                className="w-full rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-6 text-center text-sm text-ink-muted">
          Sem fotos.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={!canAddPhoto || isPending}
      >
        {isPending ? "Processando..." : "Adicionar foto"}
      </Button>

      {!canAddPhoto && (
        <p className="text-xs text-ink-muted">Limite de {MAX_PHOTOS} fotos por inscrição.</p>
      )}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      {cropping && (
        <ImageCropper
          imageSrc={cropping}
          aspect={3 / 4}
          title="Ajuste a foto (retrato 3:4)"
          frameClassName="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink"
          confirmLabel="Usar esta foto"
          output={{ maxHeight: 1600, mimeType: "image/jpeg", quality: 0.9 }}
          onConfirm={uploadCropped}
          onCancel={() => setCropping(null)}
        />
      )}
    </div>
  );
}

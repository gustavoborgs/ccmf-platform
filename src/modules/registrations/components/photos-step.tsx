"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { trackEvent } from "@/shared/analytics/events";
import { Button } from "@/shared/ui/button";
import { requestPhotoUploadAction } from "../actions";

/** Carrega react-easy-crop só no browser — evita erro de SSR/HMR no webpack. */
const PhotoCropper = dynamic(
  () => import("./photo-cropper").then((mod) => ({ default: mod.PhotoCropper })),
  { ssr: false },
);

/**
 * Step 2b — upload das 2 fotos com crop 3:4 obrigatório.
 * Fluxo: arquivo → crop (canvas) → presigned URL → PUT direto no S3.
 */

const TOTAL_PHOTOS = 2;

type Slot = { previewUrl: string } | null;

export function PhotosStep({
  wizardRef,
  registrationId,
  initialCount,
  onDone,
}: {
  wizardRef: string | null;
  registrationId: string;
  initialCount: number;
  onDone: () => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: TOTAL_PHOTOS }, (_, index) =>
      index < initialCount ? { previewUrl: "" } : null,
    ),
  );
  const [cropping, setCropping] = useState<{ slotIndex: number; imageSrc: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef(0);

  const uploadedCount = slots.filter(Boolean).length;

  function pickFile(slotIndex: number) {
    targetSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  }

  function onFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () =>
      setCropping({ slotIndex: targetSlotRef.current, imageSrc: String(reader.result) });
    reader.readAsDataURL(file);
  }

  async function uploadCropped(result: { blob: Blob; width: number; height: number }) {
    if (!cropping) return;
    const { slotIndex } = cropping;
    setCropping(null);
    setUploading(true);
    setError(null);

    try {
      const action = await requestPhotoUploadAction(wizardRef, {
        registrationId,
        fileName: `foto-${slotIndex + 1}.jpg`,
        contentType: "image/jpeg",
        width: result.width,
        height: result.height,
      });
      if (!action.ok) throw new Error(action.error);

      const put = await fetch(action.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: result.blob,
      });
      if (!put.ok) throw new Error("Falha no envio da foto. Tente novamente.");

      const previewUrl = URL.createObjectURL(result.blob);
      const nextUploadedCount = slots.filter((slot, i) => i === slotIndex || Boolean(slot)).length;
      setSlots((current) => current.map((slot, i) => (i === slotIndex ? { previewUrl } : slot)));
      trackEvent("photo_upload", {
        photo_slot: slotIndex + 1,
        photos_count: nextUploadedCount,
      });
      if (nextUploadedCount === TOTAL_PHOTOS) {
        trackEvent("registration_photos_complete", { photos_count: TOTAL_PHOTOS });
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro no envio.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        Envie <strong>2 fotos</strong> no formato retrato. Recomendamos pelo menos uma foto de
        rostinho, com boa iluminação e expressão natural.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot, index) => (
          <div key={index} className="space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-bubble border-2 border-dashed border-primary-200 bg-primary-50">
              {slot?.previewUrl ? (
                // preview local (object URL) — next/image não se aplica
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slot.previewUrl} alt={`Foto ${index + 1}`} className="size-full object-cover" />
              ) : slot ? (
                <div className="flex size-full items-center justify-center text-sm font-bold text-primary-600">
                  Foto {index + 1} enviada
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pickFile(index)}
                  disabled={uploading}
                  className="flex size-full flex-col items-center justify-center gap-1 text-primary-600 transition hover:bg-primary-100"
                >
                  <span className="font-display text-3xl font-extrabold">+</span>
                  <span className="text-sm font-bold">Foto {index + 1}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          onFileSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {uploading && <p className="text-sm font-semibold text-primary-700">Enviando foto...</p>}
      {error && <p className="text-sm font-semibold text-accent-700">{error}</p>}

      <Button
        onClick={() => {
          trackEvent("registration_step_complete", { step: "photos", photos_count: TOTAL_PHOTOS });
          onDone();
        }}
        disabled={uploadedCount < TOTAL_PHOTOS || uploading}
      >
        Continuar para o pagamento
      </Button>

      {cropping && (
        <PhotoCropper
          imageSrc={cropping.imageSrc}
          onConfirm={uploadCropped}
          onCancel={() => setCropping(null)}
        />
      )}
    </div>
  );
}

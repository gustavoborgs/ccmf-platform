"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui";
import {
  cancelGuardianRegistrationAction,
  replaceGuardianPhotoAction,
  uploadGuardianPhotoAction,
} from "../actions";

const ImageCropper = dynamic(
  () => import("@/shared/ui/image-cropper").then((mod) => ({ default: mod.ImageCropper })),
  { ssr: false },
);

export type AccountPhoto = {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
};

const TOTAL_PHOTOS = 2;

type CropTarget =
  | { mode: "add"; slotIndex: number }
  | { mode: "replace"; photoId: string };

/**
 * Anexar e trocar fotos pelo responsável em `/conta` — disponível apenas enquanto
 * o pagamento não foi confirmado (DRAFT/PENDING_PAYMENT). Crop 3:4 obrigatório.
 */
export function GuardianPhotoManager({
  registrationId,
  photos,
}: {
  registrationId: string;
  photos: AccountPhoto[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropTargetRef = useRef<CropTarget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cropping, setCropping] = useState<{ target: CropTarget; imageSrc: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slots = Array.from(
    { length: TOTAL_PHOTOS },
    (_, index) => photos.find((photo) => photo.order === index) ?? null,
  );

  function pickFile(target: CropTarget) {
    cropTargetRef.current = target;
    fileInputRef.current?.click();
  }

  function onFileSelected(file: File | undefined) {
    const target = cropTargetRef.current;
    if (!file || !target) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCropping({ target, imageSrc: String(reader.result) });
    reader.onerror = () => setError("Não foi possível abrir a imagem.");
    reader.readAsDataURL(file);
  }

  function uploadCropped(result: { blob: Blob; width: number; height: number }) {
    if (!cropping) return;
    const { target } = cropping;
    setCropping(null);
    setError(null);

    startTransition(async () => {
      const action =
        target.mode === "add"
          ? await uploadGuardianPhotoAction({
              registrationId,
              fileName: `foto-${target.slotIndex + 1}.jpg`,
              contentType: "image/jpeg",
              width: result.width,
              height: result.height,
            })
          : await replaceGuardianPhotoAction({
              photoId: target.photoId,
              fileName: `foto-${Date.now()}.jpg`,
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {slots.map((photo, index) => (
          <div key={photo?.id ?? `slot-${index}`} className="space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
              {photo ? (
                <>
                  <Image
                    src={photo.url}
                    alt={`Foto ${index + 1} da inscrição`}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-primary-700">
                    {index + 1}
                  </span>
                  {photo.isCover && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      Capa
                    </span>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => pickFile({ mode: "add", slotIndex: index })}
                  disabled={isPending}
                  className="flex size-full flex-col items-center justify-center gap-1 text-primary-600 transition hover:bg-primary-100 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="font-display text-3xl font-extrabold">+</span>
                  <span className="text-xs font-bold">Foto {index + 1}</span>
                </button>
              )}
            </div>
            {photo && (
              <button
                type="button"
                onClick={() => pickFile({ mode: "replace", photoId: photo.id })}
                disabled={isPending}
                className="w-full rounded-full border-2 border-accent-600 px-3 py-1.5 font-display text-xs font-bold text-accent-600 transition hover:bg-accent-50 disabled:pointer-events-none disabled:opacity-50"
              >
                Trocar foto
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        Envie 2 fotos no formato retrato. Você pode anexar ou trocar até a confirmação do pagamento.
      </p>

      {isPending && <p className="text-sm font-semibold text-primary-700">Enviando foto...</p>}
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}

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

      {cropping && (
        <ImageCropper
          imageSrc={cropping.imageSrc}
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

/**
 * Cancelamento da inscrição com confirmação em dialog. O service aplica o
 * soft delete e cancela cobranças locais pendentes.
 */
export function CancelRegistrationButton({
  registrationId,
  participantName,
  protocol,
}: {
  registrationId: string;
  participantName: string;
  protocol: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelGuardianRegistrationAction({ registrationId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-full border-2 border-red-200 px-6 font-display text-base font-bold text-red-600 transition hover:bg-red-50"
      >
        Cancelar inscrição
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Cancelar inscrição?</DialogTitle>
          <DialogDescription>
            A inscrição de <strong>{participantName}</strong> ({protocol}) será cancelada e qualquer
            cobrança pendente deixará de valer. Essa ação não pode ser desfeita.
          </DialogDescription>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
              Voltar
            </Button>
            <button
              type="button"
              onClick={confirmCancel}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 font-display text-base font-bold text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? "Cancelando..." : "Sim, cancelar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { ImageCropper } from "@/shared/ui/image-cropper";

/** Modal de recorte 3:4 obrigatório antes do upload (padrão da plataforma). */
export function PhotoCropper({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (result: { blob: Blob; width: number; height: number }) => void;
  onCancel: () => void;
}) {
  return (
    <ImageCropper
      imageSrc={imageSrc}
      aspect={3 / 4}
      title="Ajuste a foto (retrato 3:4)"
      frameClassName="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink"
      confirmLabel="Usar esta foto"
      output={{ maxHeight: 1600, mimeType: "image/jpeg", quality: 0.9 }}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

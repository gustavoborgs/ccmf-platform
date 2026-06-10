"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "./button";
import { cropImageToBlob } from "./crop-image";

type ImageCropperProps = {
  imageSrc: string;
  aspect: number;
  title: string;
  frameClassName: string;
  confirmLabel?: string;
  onConfirm: (result: { blob: Blob; width: number; height: number }) => void;
  onCancel: () => void;
  output?: {
    maxWidth?: number;
    maxHeight?: number;
    targetWidth?: number;
    targetHeight?: number;
    mimeType?: string;
    quality?: number;
  };
};

export function ImageCropper({
  imageSrc,
  aspect,
  title,
  frameClassName,
  confirmLabel = "Usar imagem",
  onConfirm,
  onCancel,
  output,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!areaPixels) return;
    setBusy(true);
    try {
      onConfirm(await cropImageToBlob(imageSrc, areaPixels, output));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
      <div className="w-full max-w-md rounded-bubble bg-white p-5 shadow-brand-lg">
        <h3 className="font-display text-lg font-extrabold text-primary-700">{title}</h3>

        <div className={frameClassName}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setAreaPixels(pixels)}
          />
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-1 w-full accent-accent-600"
          />
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button size="sm" onClick={confirm} disabled={busy || !areaPixels}>
            {busy ? "Recortando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

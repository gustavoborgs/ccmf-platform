"use client";

import { Download } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/shared/ui";

type FramedDownloadPhoto = {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
};

export function FramedPhotoDownload({
  photos,
  frameUrl,
  participantName,
}: {
  photos: FramedDownloadPhoto[];
  frameUrl: string;
  participantName: string;
}) {
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDownload(photo: FramedDownloadPhoto) {
    setError(null);
    setActivePhotoId(photo.id);

    startTransition(async () => {
      try {
        await downloadFramedPhoto({
          photoUrl: photo.url,
          frameUrl,
          fileName: buildFileName(participantName, photo.order),
        });
      } catch {
        setError("Não foi possível gerar a foto com moldura. Tente novamente.");
      } finally {
        setActivePhotoId(null);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
      <h4 className="font-display text-base font-extrabold text-primary-700">
        Fotos com moldura
      </h4>
      <p className="mt-1 text-sm text-ink-muted">
        Baixe as fotos oficiais com a moldura da edição, prontas para compartilhar.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => handleDownload(photo)}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 font-display text-sm font-bold text-white shadow-brand transition hover:opacity-90 active:scale-[0.98]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            <Download className="h-4 w-4" aria-hidden />
            {activePhotoId === photo.id ? "Gerando..." : `Baixar foto ${photo.order + 1}`}
            {photo.isCover && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Capa
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-accent-700">{error}</p>}
    </div>
  );
}

async function downloadFramedPhoto({
  photoUrl,
  frameUrl,
  fileName,
}: {
  photoUrl: string;
  frameUrl: string;
  fileName: string;
}) {
  const [photo, frame] = await Promise.all([
    loadImage(toOptimizedImageUrl(photoUrl)),
    loadImage(toOptimizedImageUrl(frameUrl)),
  ]);

  const width = photo.naturalWidth || 1200;
  const height = photo.naturalHeight || Math.round((width / 3) * 4);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível.");

  drawCover(context, photo, width, height);
  context.drawImage(frame, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Falha ao gerar imagem."));
    }, "image/png");
  });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar imagem."));
    image.src = src;
  });
}

function toOptimizedImageUrl(url: string): string {
  const params = new URLSearchParams({
    url,
    w: "1200",
    q: "95",
  });
  return `/_next/image?${params}`;
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;

  const sourceWidth = imageRatio > canvasRatio ? image.naturalHeight * canvasRatio : image.naturalWidth;
  const sourceHeight = imageRatio > canvasRatio ? image.naturalHeight : image.naturalWidth / canvasRatio;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function buildFileName(participantName: string, order: number): string {
  const safeName =
    participantName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "participante";

  return `ccmf-${safeName}-foto-${order + 1}-com-moldura.png`;
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/ui";

export type ReviewPhoto = {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

export function PhotoReview({
  photos,
  emptyTitle = "Sem fotos anexadas",
  emptyDescription = "A inscrição ainda não pode ser confirmada.",
}: {
  photos: ReviewPhoto[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [activePhoto, setActivePhoto] = useState<ReviewPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 px-4 py-6 text-center">
        <p className="text-sm font-bold text-primary-700">{emptyTitle}</p>
        <p className="mt-1 text-xs text-ink-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActivePhoto(photo)}
            className="group relative aspect-[3/4] w-20 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-brand focus:outline-none focus:ring-2 focus:ring-accent-300"
            aria-label={`Abrir foto ${photo.order + 1}`}
          >
            <Image
              src={photo.url}
              alt={`Foto ${photo.order + 1} da inscrição`}
              fill
              sizes="80px"
              className="object-cover transition duration-200 group-hover:scale-105"
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
          </button>
        ))}
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-3xl rounded-bubble bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-accent-700">
                  Conferência de foto
                </p>
                <h3 className="text-xl font-extrabold text-primary-700">
                  Foto {activePhoto.order + 1}
                  {activePhoto.isCover ? " · Capa" : ""}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-100"
              >
                Fechar
              </button>
            </div>

            <div className="relative mx-auto aspect-[3/4] max-h-[76vh] overflow-hidden rounded-3xl bg-primary-50">
              <Image
                src={activePhoto.url}
                alt={`Foto ${activePhoto.order + 1} ampliada`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
                unoptimized
              />
            </div>

            <p className={cn("mt-3 text-center text-xs text-ink-muted", !activePhoto.width && "hidden")}>
              {activePhoto.width} × {activePhoto.height}px
            </p>
          </div>
        </div>
      )}
    </>
  );
}

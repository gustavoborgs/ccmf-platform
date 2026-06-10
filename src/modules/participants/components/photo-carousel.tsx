"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/shared/ui";

type CarouselPhoto = {
  id: string;
  url: string;
};

/**
 * Portfólio de fotos do participante (retrato 3:4).
 * Uma foto → imagem estática; mais de uma → carrossel com scroll-snap
 * (gesto nativo de swipe no mobile) e indicadores.
 */
export function PhotoCarousel({
  photos,
  alt,
  frameUrl,
}: {
  photos: CarouselPhoto[];
  alt: string;
  frameUrl?: string | null;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-bubble bg-primary-50 text-6xl shadow-brand">
        📷
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-bubble shadow-brand-lg">
        <FramedPhoto photoUrl={photos[0].url} frameUrl={frameUrl} alt={alt} priority />
      </div>
    );
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function scrollTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-bubble shadow-brand-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`Fotos de ${alt}`}
      >
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative aspect-[3/4] w-full flex-none snap-center">
            <FramedPhoto
              photoUrl={photo.url}
              frameUrl={frameUrl}
              alt={`${alt} — foto ${index + 1} de ${photos.length}`}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ver foto ${index + 1}`}
            aria-current={active === index}
            className={cn(
              "h-2.5 rounded-full bg-white/60 shadow-sm transition-all",
              active === index ? "w-7 bg-white" : "w-2.5 hover:bg-white/85",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FramedPhoto({
  photoUrl,
  frameUrl,
  alt,
  priority,
}: {
  photoUrl: string;
  frameUrl?: string | null;
  alt: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={photoUrl}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover"
      />
      {frameUrl && (
        <Image
          src={frameUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="pointer-events-none z-10 object-cover"
          aria-hidden
        />
      )}
    </>
  );
}

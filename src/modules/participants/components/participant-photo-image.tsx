"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/ui";

export const DEFAULT_PARTICIPANT_PHOTO_URL = "/people/participant-placeholder.png";

export function ParticipantPhotoImage({
  src,
  alt,
  sizes,
  priority,
  className,
  imageClassName,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const realPhotoSrc = src && !failed ? src : null;
  const showRealPhoto = Boolean(realPhotoSrc);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <Image
        src={DEFAULT_PARTICIPANT_PHOTO_URL}
        alt={showRealPhoto ? "" : alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
        aria-hidden={showRealPhoto}
      />
      {realPhotoSrc && (
        <Image
          src={realPhotoSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "object-cover opacity-0 transition-opacity duration-300",
            loaded && "opacity-100",
            imageClassName,
          )}
        />
      )}
    </div>
  );
}

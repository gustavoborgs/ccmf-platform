"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui";
import { getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from "../youtube";

type VideoGalleryItem = {
  id: string;
  title: string;
  youtubeUrl: string;
};

export function VideoGallery({ videos }: { videos: VideoGalleryItem[] }) {
  const [activeVideo, setActiveVideo] = useState<VideoGalleryItem | null>(null);
  const embedUrl = activeVideo ? getYoutubeEmbedUrl(activeVideo.youtubeUrl) : null;

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onOpen={() => setActiveVideo(video)} />
        ))}
      </div>

      <Dialog
        open={Boolean(activeVideo)}
        onOpenChange={(open) => {
          if (!open) setActiveVideo(null);
        }}
      >
        <DialogContent className="max-w-5xl overflow-hidden p-0">
          {activeVideo && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-primary-100 p-5">
                <div>
                  <DialogTitle>{activeVideo.title}</DialogTitle>
                  <DialogDescription>Assista sem sair da página.</DialogDescription>
                </div>
                <DialogClose className="rounded-full px-3 py-1 text-2xl leading-none text-ink-muted transition hover:bg-primary-50 hover:text-primary-700">
                  ×
                </DialogClose>
              </div>

              {embedUrl ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`${embedUrl}?autoplay=1&rel=0`}
                    title={activeVideo.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-ink-muted">
                    Não foi possível montar o player deste vídeo.
                  </p>
                  <Button
                    href={activeVideo.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Abrir no YouTube
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function VideoCard({ video, onOpen }: { video: VideoGalleryItem; onOpen: () => void }) {
  const thumbnailUrl = getYoutubeThumbnailUrl(video.youtubeUrl);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-left"
        aria-label={`Assistir ${video.title}`}
      >
        <div className="relative aspect-video bg-primary-50">
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-black text-accent-700 shadow-brand transition group-hover:scale-105">
            ▶
          </span>
        </div>
      </button>
      <div className="p-5">
        <h2 className="font-display text-xl font-extrabold text-primary-700">{video.title}</h2>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onOpen}>
          Assistir aqui
        </Button>
      </div>
    </Card>
  );
}

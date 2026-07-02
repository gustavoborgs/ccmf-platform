import Image from "next/image";
import { Clock } from "lucide-react";

type ChapterHeroProps = {
  chapterNumber: number;
  title: string;
  subtitle?: string;
  cover: string;
  readingMinutes: number;
  moduleTitle: string;
};

/** Abertura visual do capítulo com gradiente e metadados. */
export function ChapterHero({
  chapterNumber,
  title,
  subtitle,
  cover,
  readingMinutes,
  moduleTitle,
}: ChapterHeroProps) {
  return (
    <header className="overflow-hidden rounded-bubble bg-brand-gradient text-white shadow-brand-lg">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_12rem] lg:items-end">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest text-white/80">
            {moduleTitle}
          </p>
          <p className="mt-2 font-display text-sm font-bold uppercase tracking-widest text-white/70">
            Capítulo {chapterNumber}
          </p>
          <h1 className="mt-3 text-balance text-3xl font-extrabold sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-white/90">{subtitle}</p>}
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/80">
            <Clock aria-hidden className="h-4 w-4" />
            {readingMinutes} min de leitura
          </p>
        </div>
        <div className="relative mx-auto aspect-[4/3] w-full max-w-[12rem] overflow-hidden rounded-2xl border-2 border-white/30 lg:mx-0">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="12rem"
            priority
          />
        </div>
      </div>
    </header>
  );
}

import Image from "next/image";
import { BookOpen, Clock } from "lucide-react";
import type { TrainingMeta } from "../types";

type TrainingHeroProps = {
  meta: TrainingMeta;
};

/** Capa do treinamento na página índice. */
export function TrainingHero({ meta }: TrainingHeroProps) {
  return (
    <header className="overflow-hidden rounded-bubble bg-brand-gradient text-white shadow-brand-lg">
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_16rem] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 font-display text-xs font-bold uppercase tracking-widest">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            Treinamento premium
          </p>
          <h1 className="mt-4 text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-4 text-lg text-white/90">{meta.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm/7 text-white/85">{meta.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <BookOpen aria-hidden className="h-4 w-4" />
              {meta.totalChapters} capítulos
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden className="h-4 w-4" />~{meta.totalReadingMinutes} min no total
            </span>
          </div>
          <p className="mt-6 text-sm font-semibold text-white/90">
            Por {meta.author} · {meta.authorRole}
          </p>
        </div>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-bubble border-4 border-white/30 lg:mx-0">
          <Image
            src={meta.cover}
            alt="Capa do treinamento Como Gerenciar a Carreira do Seu Filho"
            fill
            className="object-cover"
            sizes="16rem"
            priority
          />
        </div>
      </div>
    </header>
  );
}

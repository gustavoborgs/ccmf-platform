import Link from "next/link";
import { Clock, GraduationCap, Lock } from "lucide-react";
import { Card, cn } from "@/shared/ui";
import type { ModuleWithChapters } from "../types";

type ModuleIndexProps = {
  modules: ModuleWithChapters[];
  /** Slugs de módulos bloqueados (visitante sem inscrição paga). */
  lockedModuleSlugs?: string[];
};

/** Índice de módulos e capítulos na home do treinamento. */
export function ModuleIndex({ modules, lockedModuleSlugs = [] }: ModuleIndexProps) {
  return (
    <div className="space-y-10">
      {modules.map((module) => {
        const locked = lockedModuleSlugs.includes(module.slug);

        return (
          <section key={module.slug} aria-labelledby={`module-${module.slug}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-xs font-extrabold uppercase tracking-widest text-accent-700">
                  Módulo {module.order}
                  {locked && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-primary-600">
                      <Lock aria-hidden className="h-3 w-3" />
                      Exclusivo para inscritos
                    </span>
                  )}
                </p>
                <h2
                  id={`module-${module.slug}`}
                  className="mt-1 font-display text-2xl font-extrabold text-primary-700"
                >
                  {module.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">{module.description}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {module.chapters.map((chapter) => {
                const card = (
                  <Card
                    className={cn(
                      "flex items-center gap-4 transition",
                      locked
                        ? "opacity-70"
                        : "hover:border-accent-200 hover:shadow-brand",
                    )}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 font-display text-sm font-extrabold text-primary-700">
                      {chapter.chapterNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-extrabold text-primary-700">
                        {chapter.title}
                      </h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock aria-hidden className="h-3.5 w-3.5" />
                        {chapter.readingMinutes} min
                      </p>
                    </div>
                    {locked ? (
                      <Lock aria-hidden className="h-5 w-5 shrink-0 text-primary-300" />
                    ) : (
                      <GraduationCap aria-hidden className="h-5 w-5 shrink-0 text-accent-600" />
                    )}
                  </Card>
                );

                return locked ? (
                  <Link
                    key={chapter.slug}
                    href="#oferta"
                    aria-label={`${chapter.title} (exclusivo para inscritos)`}
                  >
                    {card}
                  </Link>
                ) : (
                  <Link key={chapter.slug} href={`/conta/formacao/${chapter.slug}`}>
                    {card}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

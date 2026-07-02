import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui";
import type { AcademyChapter } from "../types";

type ChapterNavProps = {
  previous: AcademyChapter | null;
  next: AcademyChapter | null;
};

/** Navegação anterior/próximo entre capítulos. */
export function ChapterNav({ previous, next }: ChapterNavProps) {
  return (
    <nav
      aria-label="Navegação entre capítulos"
      className="grid gap-4 border-t border-primary-100 pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={`/conta/formacao/${previous.slug}`}
          className="group flex items-center gap-3 rounded-bubble border border-primary-100 bg-white p-4 transition hover:border-accent-200 hover:bg-accent-50/30"
        >
          <ArrowLeft
            aria-hidden
            className="h-5 w-5 shrink-0 text-accent-600 transition group-hover:-translate-x-0.5"
          />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Anterior</p>
            <p className="truncate font-display font-bold text-primary-700">{previous.title}</p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/conta/formacao/${next.slug}`}
          className="group flex items-center justify-end gap-3 rounded-bubble border border-primary-100 bg-white p-4 text-right transition hover:border-accent-200 hover:bg-accent-50/30 sm:col-start-2"
        >
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-muted">Próximo</p>
            <p className="truncate font-display font-bold text-primary-700">{next.title}</p>
          </div>
          <ArrowRight
            aria-hidden
            className="h-5 w-5 shrink-0 text-accent-600 transition group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <div className="sm:col-start-2">
          <Button href="/conta/formacao" variant="outline" className="w-full">
            Voltar ao índice
          </Button>
        </div>
      )}
    </nav>
  );
}

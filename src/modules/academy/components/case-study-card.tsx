import { BookOpen, Lightbulb } from "lucide-react";

type CaseStudyCardProps = {
  title: string;
  body: string;
  takeaway: string;
};

/** Bloco "Caso Real" com takeaway destacado. */
export function CaseStudyCard({ title, body, takeaway }: CaseStudyCardProps) {
  return (
    <aside className="rounded-bubble border border-info-400/30 bg-info-400/5 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-info-400/15 text-info-600">
          <BookOpen aria-hidden className="h-4 w-4" />
        </span>
        <p className="font-display text-xs font-extrabold uppercase tracking-widest text-info-600">
          Caso Real
        </p>
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold text-primary-700">{title}</h3>
      <p className="mt-2 text-sm/7 text-ink-muted">{body}</p>
      <div className="mt-4 flex gap-2 rounded-2xl bg-white/80 px-4 py-3">
        <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
        <p className="text-sm font-semibold text-ink">
          <span className="text-accent-700">Leve: </span>
          {takeaway}
        </p>
      </div>
    </aside>
  );
}

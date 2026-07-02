import { PencilLine } from "lucide-react";

type ExerciseBoxProps = {
  title: string;
  steps: string[];
};

/** Bloco "Faça agora" com passos numerados. */
export function ExerciseBox({ title, steps }: ExerciseBoxProps) {
  return (
    <aside className="rounded-bubble border border-accent-200 bg-accent-50/60 p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <PencilLine aria-hidden className="h-4 w-4" />
        </span>
        <p className="font-display text-xs font-extrabold uppercase tracking-widest text-accent-700">
          Faça agora
        </p>
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold text-primary-700">{title}</h3>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3 text-sm/7 text-ink-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

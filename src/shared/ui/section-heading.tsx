import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Cabeçalho padrão de seção da home: kicker em pink + título display com
 * gradiente da marca + descrição opcional.
 */
export function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
  className,
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker && (
        <p className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-accent-600">
          {kicker}
        </p>
      )}
      <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
        <span className="text-brand-gradient">{title}</span>
      </h2>
      {description && <p className="mt-4 text-lg text-ink-muted">{description}</p>}
    </div>
  );
}

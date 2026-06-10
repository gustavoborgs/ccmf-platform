import type { ReactNode } from "react";
import { cn } from "./cn";

/** Cartão bubble: cantos bem arredondados + sombra colorida suave. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-bubble border border-primary-100 bg-white p-6 shadow-brand",
        className,
      )}
    >
      {children}
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "./cn";

/** Campos de formulário no padrão do design system (docs/05-design-system.md). */

const inputClasses =
  "w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 text-ink " +
  "placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none " +
  "focus:ring-2 focus:ring-accent-200 disabled:opacity-60";

export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-accent-700">{error}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, className)} {...props}>
      {children}
    </select>
  );
}

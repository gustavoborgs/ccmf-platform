"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/ui";

type ChecklistProps = {
  items: string[];
};

/** Checklist interativa (estado local, sem persistência). */
export function Checklist({ items }: ChecklistProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const isChecked = checked[index] ?? false;

        return (
          <li key={index}>
            <button
              type="button"
              onClick={() => setChecked((prev) => ({ ...prev, [index]: !isChecked }))}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                isChecked
                  ? "border-accent-200 bg-accent-50/50 text-ink-muted line-through"
                  : "border-primary-100 bg-white text-ink hover:bg-primary-50/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  isChecked ? "border-accent-600 bg-accent-600 text-white" : "border-primary-200",
                )}
              >
                {isChecked && <Check aria-hidden className="h-3 w-3" />}
              </span>
              <span className="pt-0.5">{item}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

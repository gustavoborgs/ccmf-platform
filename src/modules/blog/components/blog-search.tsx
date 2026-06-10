"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Busca pública do blog. O estado fica na URL para preservar Server Components,
 * compartilhamento e histórico do navegador.
 */
export function BlogSearch({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyQuery(query: string) {
    const params = new URLSearchParams(searchParams);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function handleChange(query: string) {
    setValue(query);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => applyQuery(query), 350);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setValue("");
    applyQuery("");
  }

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Buscar dicas, etapas, fotos..."
        aria-label="Buscar posts no blog"
        className="h-11 w-full rounded-full border border-primary-100 bg-white pl-11 pr-10 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-muted focus:border-accent-400 focus:ring-2 focus:ring-accent-200 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted transition hover:bg-primary-50 hover:text-primary-700"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

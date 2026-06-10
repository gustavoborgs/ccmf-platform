"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "../cn";
import { Popover, PopoverContent, PopoverTrigger, usePopover } from "../popover";
import type { DataTableFilter } from "./types";

const DEFAULT_PAGE_SIZES = [20, 50, 100];

/**
 * Toolbar de listagem (estilo ClickUp/shadcn): busca com debounce, filtros
 * facetados em popover e volume por página. Todo o estado vai para a URL,
 * preservando os demais parâmetros e voltando à página 1 a cada mudança.
 */
export function DataTableToolbar({
  searchPlaceholder = "Buscar...",
  searchParam = "q",
  filters = [],
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: {
  searchPlaceholder?: string;
  searchParam?: string;
  filters?: DataTableFilter[];
  pageSizeOptions?: number[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get(searchParam) ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function applyParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyParams({ [searchParam]: value }), 400);
  }

  const hasActiveCriteria =
    Boolean(searchParams.get(searchParam)) ||
    filters.some((filter) => searchParams.get(filter.id));

  function clearAll() {
    setSearch("");
    clearTimeout(debounceRef.current);
    applyParams({
      [searchParam]: null,
      ...Object.fromEntries(filters.map((filter) => [filter.id, null])),
    });
  }

  const pageSize = searchParams.get("pageSize") ?? String(pageSizeOptions[0]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-primary-100 px-5 py-4",
        className,
      )}
    >
      <form
        className="min-w-56 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          clearTimeout(debounceRef.current);
          applyParams({ [searchParam]: search });
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full max-w-sm rounded-full border border-primary-200 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
        />
      </form>

      {filters.map((filter) => (
        <FilterPopover
          key={filter.id}
          filter={filter}
          value={searchParams.get(filter.id)}
          onChange={(value) => applyParams({ [filter.id]: value })}
        />
      ))}

      {hasActiveCriteria && (
        <button
          type="button"
          onClick={clearAll}
          className="h-10 rounded-full px-4 text-sm font-bold text-accent-700 transition hover:bg-accent-50"
        >
          Limpar filtros
        </button>
      )}

      <label className="ml-auto flex items-center gap-2 text-sm text-ink-muted">
        Por página
        <select
          value={pageSize}
          onChange={(event) => applyParams({ pageSize: event.target.value })}
          className="h-10 rounded-full border border-primary-200 bg-white px-3 text-sm font-bold text-primary-700 outline-none transition focus:border-accent-500"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function FilterPopover({
  filter,
  value,
  onChange,
}: {
  filter: DataTableFilter;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const selected = filter.options.find((option) => option.value === value);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-bold transition",
          selected
            ? "border-accent-500 bg-accent-50 text-accent-700"
            : "border-primary-200 text-primary-700 hover:bg-primary-50",
        )}
      >
        {filter.label}
        {selected && (
          <span className="max-w-36 truncate rounded-full bg-accent-600 px-2 py-0.5 text-xs text-white">
            {selected.label}
          </span>
        )}
        <span aria-hidden className="text-xs opacity-60">
          ▾
        </span>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 w-64 overflow-y-auto">
        <FilterOptions filter={filter} value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

function FilterOptions({
  filter,
  value,
  onChange,
}: {
  filter: DataTableFilter;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { setOpen } = usePopover();

  function select(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <ul className="space-y-1">
        {filter.options.map((option) => {
          const isSelected = option.value === value;
          return (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => select(isSelected ? null : option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                  isSelected
                    ? "bg-accent-50 font-bold text-accent-700"
                    : "text-ink hover:bg-primary-50",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <span aria-hidden>✓</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {value && (
        <button
          type="button"
          onClick={() => select(null)}
          className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-bold text-accent-700 transition hover:bg-accent-50"
        >
          Limpar filtro
        </button>
      )}
    </>
  );
}

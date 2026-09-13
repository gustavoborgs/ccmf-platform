"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/shared/ui";
import {
  DASHBOARD_PERIODS,
  DASHBOARD_PERIOD_LABELS,
  type DashboardFilters,
} from "../validators";

/**
 * Filtro de período do dashboard: presets em pílulas + intervalo custom.
 * Estado vive na URL (`period` ou `from`/`to`), como nas listagens admin.
 */
export function DashboardPeriodFilter({ filters }: { filters: DashboardFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isCustom = Boolean(filters.from && filters.to);
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  function applyParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function selectPreset(period: string) {
    setFrom("");
    setTo("");
    applyParams({ period, from: null, to: null });
  }

  function applyCustomRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (nextFrom && nextTo && nextFrom <= nextTo) {
      applyParams({ period: null, from: nextFrom, to: nextTo });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-full border border-primary-100 bg-white p-1">
        {DASHBOARD_PERIODS.map((period) => {
          const active = !isCustom && filters.period === period;
          return (
            <button
              key={period}
              type="button"
              onClick={() => selectPreset(period)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-bold transition",
                active
                  ? "bg-brand-gradient text-white shadow-brand"
                  : "text-primary-700 hover:bg-primary-50",
              )}
            >
              {DASHBOARD_PERIOD_LABELS[period]}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm transition",
          isCustom ? "border-accent-500 bg-accent-50" : "border-primary-100",
        )}
      >
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => applyCustomRange(event.target.value, to)}
          aria-label="Data inicial"
          className="bg-transparent font-semibold text-primary-700 outline-none"
        />
        <span className="text-ink-muted">até</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => applyCustomRange(from, event.target.value)}
          aria-label="Data final"
          className="bg-transparent font-semibold text-primary-700 outline-none"
        />
        {isCustom && (
          <button
            type="button"
            onClick={() => selectPreset("30d")}
            aria-label="Limpar intervalo"
            className="rounded-full px-1.5 font-bold text-accent-700 transition hover:bg-accent-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

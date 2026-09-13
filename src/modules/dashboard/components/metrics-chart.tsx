"use client";

import { useState } from "react";
import { cn } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";
import type { DashboardSeriesPoint, DashboardTotals } from "../types";

/**
 * Gráfico de área minimalista do dashboard (SVG puro, sem lib externa —
 * mesmo espírito de Popover/Dialog do design system). Abas trocam a métrica;
 * hover mostra crosshair + tooltip com todas as métricas do bucket.
 */

type MetricKind = "currency" | "count";
type MetricKey = "revenueCents" | "paidRegistrations" | "newRegistrations" | "newLeads";

const METRICS: { key: MetricKey; label: string; kind: MetricKind }[] = [
  { key: "revenueCents", label: "Faturamento", kind: "currency" },
  { key: "paidRegistrations", label: "Inscrições pagas", kind: "count" },
  { key: "newRegistrations", label: "Novas inscrições", kind: "count" },
  { key: "newLeads", label: "Leads", kind: "count" },
];

// Cores da marca (docs/05-design-system.md) — SVG não lê classes Tailwind.
const BRAND_PURPLE = "#8E18B4";
const BRAND_PINK = "#EC1380";

const compactNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatValue(kind: MetricKind, value: number): string {
  return kind === "currency" ? formatCentsBRL(value) : value.toLocaleString("pt-BR");
}

function formatAxis(kind: MetricKind, value: number): string {
  return kind === "currency" ? `R$ ${compactNumber.format(value / 100)}` : compactNumber.format(value);
}

/** Variação percentual vs período anterior de mesma duração. */
function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span
        title="Sem base de comparação no período anterior"
        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700"
      >
        novo
      </span>
    );
  }

  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(percent);
  const tone =
    rounded > 0
      ? "bg-emerald-50 text-emerald-700"
      : rounded < 0
        ? "bg-red-50 text-red-700"
        : "bg-primary-50 text-primary-700";
  const arrow = rounded > 0 ? "↑" : rounded < 0 ? "↓" : "→";

  return (
    <span
      title="Comparação com o período anterior de mesma duração"
      className={cn("rounded-full px-2 py-0.5 text-xs font-extrabold", tone)}
    >
      {arrow} {Math.abs(rounded)}%
    </span>
  );
}

/** Teto "bonito" para a escala do eixo y (1/2/2.5/5 × 10^k). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

export function DashboardMetricsChart({
  series,
  totals,
  previous,
}: {
  series: DashboardSeriesPoint[];
  totals: DashboardTotals;
  /** janela anterior de mesma duração para os deltas; null = sem comparação */
  previous: DashboardTotals | null;
}) {
  const [metricKey, setMetricKey] = useState<MetricKey>("revenueCents");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const metric = METRICS.find((candidate) => candidate.key === metricKey)!;
  const count = series.length;

  const values = series.map((point) => point[metricKey]);
  const maxValue = niceCeil(Math.max(...values, 0));

  // Coordenadas normalizadas (0..100) — o SVG estica com preserveAspectRatio="none".
  const positionX = (index: number) => (count > 1 ? (index / (count - 1)) * 100 : 50);
  const positionY = (value: number) => 100 - (value / maxValue) * 100;

  const linePoints =
    count === 1
      ? [
          { x: 0, y: positionY(values[0]) },
          { x: 100, y: positionY(values[0]) },
        ]
      : values.map((value, index) => ({ x: positionX(index), y: positionY(value) }));

  const linePath = linePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  // Rótulos do eixo x: no máximo 6, sempre incluindo o último.
  const xTickStep = Math.max(1, Math.ceil(count / 6));
  const xTicks = series
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => index % xTickStep === 0 || index === count - 1);

  const hovered = hoverIndex !== null ? series[hoverIndex] : null;
  const hoveredX = hoverIndex !== null ? positionX(hoverIndex) : 0;
  const isEmpty = values.every((value) => value === 0);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (count - 1));
    setHoverIndex(Math.min(count - 1, Math.max(0, index)));
  }

  return (
    <div>
      {/* Abas de métrica, com o total do período em cada aba */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {METRICS.map((candidate) => {
          const active = candidate.key === metricKey;
          return (
            <button
              key={candidate.key}
              type="button"
              onClick={() => setMetricKey(candidate.key)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-accent-500 bg-accent-50 shadow-brand"
                  : "border-primary-100 bg-white hover:border-primary-200 hover:bg-primary-50/50",
              )}
            >
              <span
                className={cn(
                  "block text-xs font-extrabold uppercase tracking-wide",
                  active ? "text-accent-700" : "text-ink-muted",
                )}
              >
                {candidate.label}
              </span>
              <span className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-extrabold text-primary-700">
                  {formatValue(candidate.kind, totals[candidate.key])}
                </span>
                {previous && (
                  <DeltaBadge current={totals[candidate.key]} previous={previous[candidate.key]} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        {/* Eixo y */}
        <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-xs font-semibold text-ink-muted">
          <span>{formatAxis(metric.kind, maxValue)}</span>
          <span>{formatAxis(metric.kind, maxValue / 2)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Área do gráfico */}
          <div
            className="relative h-56 cursor-crosshair sm:h-64"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              role="img"
              aria-label={`Evolução de ${metric.label.toLowerCase()} no período`}
            >
              <defs>
                <linearGradient id="dashboard-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_PINK} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={BRAND_PURPLE} stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="dashboard-chart-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BRAND_PURPLE} />
                  <stop offset="100%" stopColor={BRAND_PINK} />
                </linearGradient>
              </defs>

              {/* linhas de grade */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke={BRAND_PURPLE}
                  strokeOpacity={y === 100 ? 0.25 : 0.08}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={areaPath} fill="url(#dashboard-chart-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#dashboard-chart-stroke)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* crosshair + ponto + tooltip */}
            {hovered && (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 w-px bg-primary-300"
                  style={{ left: `${hoveredX}%` }}
                />
                <div
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-600 shadow-brand"
                  style={{
                    left: `${hoveredX}%`,
                    top: `${positionY(hovered[metricKey])}%`,
                  }}
                />
                <div
                  className="pointer-events-none absolute top-2 z-10 w-max rounded-2xl border border-primary-100 bg-white/95 px-4 py-3 text-sm shadow-brand backdrop-blur"
                  style={{
                    left: `${hoveredX}%`,
                    transform:
                      hoveredX < 15
                        ? "translateX(8px)"
                        : hoveredX > 85
                          ? "translateX(calc(-100% - 8px))"
                          : "translateX(-50%)",
                  }}
                >
                  <p className="font-extrabold text-primary-700">{hovered.label}</p>
                  <dl className="mt-1.5 space-y-0.5">
                    {METRICS.map((candidate) => (
                      <div
                        key={candidate.key}
                        className={cn(
                          "flex items-center justify-between gap-6",
                          candidate.key === metricKey
                            ? "font-extrabold text-accent-700"
                            : "text-ink-muted",
                        )}
                      >
                        <dt>{candidate.label}</dt>
                        <dd>{formatValue(candidate.kind, hovered[candidate.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </>
            )}

            {isEmpty && (
              <p className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink-muted">
                Sem dados no período selecionado.
              </p>
            )}
          </div>

          {/* Eixo x */}
          <div className="relative mt-2 h-4 text-xs font-semibold text-ink-muted">
            {xTicks.map(({ point, index }) => (
              <span
                key={point.key}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${positionX(index)}%`,
                  transform:
                    index === 0
                      ? "none"
                      : index === count - 1
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                }}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { z } from "zod";

/** Validação dos searchParams do dashboard. Spec: docs/modules/dashboard.md */

export const DASHBOARD_PERIODS = ["7d", "30d", "90d", "12m", "all"] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
  all: "Tudo",
};

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** Data yyyy-mm-dd; inválida → undefined. */
const dateParam = z.preprocess(
  firstValue,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
);

export const dashboardFiltersSchema = z
  .object({
    period: z.preprocess(firstValue, z.enum(DASHBOARD_PERIODS).catch("30d")),
    from: dateParam,
    to: dateParam,
  })
  .transform((filters) => {
    // Intervalo custom só vale com as duas datas presentes e em ordem;
    // senão cai no preset.
    const hasCustomRange = Boolean(filters.from && filters.to && filters.from <= filters.to);
    return {
      period: filters.period,
      from: hasCustomRange ? filters.from : undefined,
      to: hasCustomRange ? filters.to : undefined,
    };
  });

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

import { db } from "@/shared/db";
import { APP_TIMEZONE } from "@/shared/datetime";
import type { PaymentMethod, PaymentStatus, RegistrationStatus } from "@/generated/prisma/enums";
import type {
  DashboardBucket,
  DashboardSeriesPoint,
  DashboardStats,
  DashboardTotals,
} from "./types";
import type { DashboardFilters, DashboardPeriod } from "./validators";

/**
 * Módulo Dashboard: métricas agregadas (somente leitura) para o painel admin.
 * Deriva tudo de Registration/Payment/Lead — nada é persistido aqui.
 * Spec: docs/modules/dashboard.md
 */

/** America/Sao_Paulo sem horário de verão desde 2019 — offset fixo. */
const SP_UTC_OFFSET = "-03:00";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Janelas de até 92 dias → série diária; acima → mensal. */
const MAX_DAILY_BUCKETS = 92;

const PAID_STATUSES: PaymentStatus[] = ["CONFIRMED", "RECEIVED"];

const PRESET_DAYS: Record<Exclude<DashboardPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

/** Ordem de exibição da máquina de estados de Registration. */
const STATUS_ORDER: RegistrationStatus[] = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAID",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SEMIFINALIST",
  "WINNER",
];

const spDayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
});

const monthLabelFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIMEZONE,
  month: "short",
  year: "2-digit",
});

/** "2026-09-13" → Date no início do dia em São Paulo. */
function spDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000${SP_UTC_OFFSET}`);
}

/** "2026-09-13" → Date no fim do dia em São Paulo. */
function spDayEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999${SP_UTC_OFFSET}`);
}

/** Chave do bucket ("yyyy-mm-dd" ou "yyyy-mm") de uma data, no fuso SP. */
function bucketKey(date: Date, bucket: DashboardBucket): string {
  const dayKey = spDayKeyFormat.format(date);
  return bucket === "day" ? dayKey : dayKey.slice(0, 7);
}

async function resolveRange(
  filters: DashboardFilters,
): Promise<{ from: Date; to: Date; includePrevious: boolean }> {
  const now = new Date();

  if (filters.from && filters.to) {
    return { from: spDayStart(filters.from), to: spDayEnd(filters.to), includePrevious: true };
  }

  if (filters.period === "all") {
    const [firstRegistration, firstLead] = await Promise.all([
      db.registration.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      db.lead.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);
    const candidates = [firstRegistration?.createdAt, firstLead?.createdAt].filter(
      (date): date is Date => Boolean(date),
    );
    const earliest =
      candidates.length > 0
        ? new Date(Math.min(...candidates.map((date) => date.getTime())))
        : new Date(now.getTime() - 29 * DAY_MS);
    return { from: spDayStart(spDayKeyFormat.format(earliest)), to: now, includePrevious: false };
  }

  const days = PRESET_DAYS[filters.period];
  const firstDay = spDayKeyFormat.format(new Date(now.getTime() - (days - 1) * DAY_MS));
  return { from: spDayStart(firstDay), to: now, includePrevious: true };
}

/** Enumera as chaves de bucket entre from e to (inclusive), já com rótulo. */
function enumerateBuckets(from: Date, to: Date, bucket: DashboardBucket) {
  const buckets: { key: string; label: string }[] = [];
  const lastKey = bucketKey(to, bucket);
  const labelFormat = bucket === "day" ? dayLabelFormat : monthLabelFormat;

  let cursor = from;
  let previousKey = "";
  // Passo diário é suficiente para os dois buckets (chaves repetidas são puladas).
  while (buckets.length < 1000) {
    const key = bucketKey(cursor, bucket);
    if (key !== previousKey) {
      buckets.push({ key, label: labelFormat.format(cursor) });
      previousKey = key;
    }
    if (key === lastKey) break;
    cursor = new Date(cursor.getTime() + DAY_MS);
  }
  return buckets;
}

/** Totais de uma janela via agregações (usado para o período anterior). */
async function getWindowTotals(from: Date, to: Date): Promise<DashboardTotals> {
  const paidWhere = { status: { in: PAID_STATUSES }, paidAt: { gte: from, lte: to } };

  const [revenue, paidRegistrations, newRegistrations, newLeads] = await Promise.all([
    db.payment.aggregate({ _sum: { amountCents: true }, where: paidWhere }),
    db.payment.findMany({
      where: paidWhere,
      distinct: ["registrationId"],
      select: { registrationId: true },
    }),
    db.registration.count({ where: { deletedAt: null, createdAt: { gte: from, lte: to } } }),
    db.lead.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  return {
    revenueCents: revenue._sum.amountCents ?? 0,
    paidRegistrations: paidRegistrations.length,
    newRegistrations,
    newLeads,
  };
}

/** KPIs, série temporal e quebras do período — consumido pela página /admin. */
export async function getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
  const { from, to, includePrevious } = await resolveRange(filters);
  const rangeDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
  const bucket: DashboardBucket = rangeDays <= MAX_DAILY_BUCKETS ? "day" : "month";

  const durationMs = to.getTime() - from.getTime();
  const previousFrom = new Date(from.getTime() - durationMs - 1);
  const previousTo = new Date(from.getTime() - 1);

  const [registrations, paidPayments, leads, previous] = await Promise.all([
    db.registration.findMany({
      where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      select: { createdAt: true, status: true },
    }),
    db.payment.findMany({
      where: { status: { in: PAID_STATUSES }, paidAt: { gte: from, lte: to } },
      select: { paidAt: true, amountCents: true, method: true, registrationId: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    includePrevious ? getWindowTotals(previousFrom, previousTo) : Promise.resolve(null),
  ]);

  // ── Série temporal ────────────────────────────────────────────────
  const buckets = enumerateBuckets(from, to, bucket);
  const pointByKey = new Map<string, DashboardSeriesPoint>(
    buckets.map(({ key, label }) => [
      key,
      { key, label, revenueCents: 0, paidRegistrations: 0, newRegistrations: 0, newLeads: 0 },
    ]),
  );
  // inscrições distintas por bucket (uma inscrição pode ter 2 cobranças pagas)
  const paidRegistrationsByBucket = new Map<string, Set<string>>();

  for (const registration of registrations) {
    const point = pointByKey.get(bucketKey(registration.createdAt, bucket));
    if (point) point.newRegistrations += 1;
  }
  for (const lead of leads) {
    const point = pointByKey.get(bucketKey(lead.createdAt, bucket));
    if (point) point.newLeads += 1;
  }
  for (const payment of paidPayments) {
    if (!payment.paidAt) continue;
    const key = bucketKey(payment.paidAt, bucket);
    const point = pointByKey.get(key);
    if (!point) continue;
    point.revenueCents += payment.amountCents;
    const seen = paidRegistrationsByBucket.get(key) ?? new Set<string>();
    seen.add(payment.registrationId);
    paidRegistrationsByBucket.set(key, seen);
  }
  for (const [key, registrationIds] of paidRegistrationsByBucket) {
    pointByKey.get(key)!.paidRegistrations = registrationIds.size;
  }

  // ── Totais ────────────────────────────────────────────────────────
  const revenueCents = paidPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const paidRegistrationIds = new Set(paidPayments.map((payment) => payment.registrationId));
  const paidCount = paidRegistrationIds.size;

  // ── Quebras ───────────────────────────────────────────────────────
  const statusCounts = new Map<RegistrationStatus, number>();
  for (const registration of registrations) {
    statusCounts.set(registration.status, (statusCounts.get(registration.status) ?? 0) + 1);
  }
  const registrationsByStatus = STATUS_ORDER.filter((status) => statusCounts.has(status)).map(
    (status) => ({ status, count: statusCounts.get(status)! }),
  );

  const methodTotals = new Map<PaymentMethod, { count: number; amountCents: number }>();
  for (const payment of paidPayments) {
    const entry = methodTotals.get(payment.method) ?? { count: 0, amountCents: 0 };
    entry.count += 1;
    entry.amountCents += payment.amountCents;
    methodTotals.set(payment.method, entry);
  }
  const paymentsByMethod = [...methodTotals.entries()]
    .map(([method, totals]) => ({ method, ...totals }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return {
    range: { from, to, bucket },
    totals: {
      revenueCents,
      paidRegistrations: paidCount,
      newRegistrations: registrations.length,
      newLeads: leads.length,
      avgTicketCents: paidCount > 0 ? Math.round(revenueCents / paidCount) : null,
    },
    previous,
    series: buckets.map(({ key }) => pointByKey.get(key)!),
    registrationsByStatus,
    paymentsByMethod,
  };
}

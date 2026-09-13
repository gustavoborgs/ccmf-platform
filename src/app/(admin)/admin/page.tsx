import { DashboardMetricsChart } from "@/modules/dashboard/components/metrics-chart";
import { DashboardPeriodFilter } from "@/modules/dashboard/components/period-filter";
import { getDashboardStats } from "@/modules/dashboard/service";
import { dashboardFiltersSchema } from "@/modules/dashboard/validators";
import { Card } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";
import {
  formatDate,
  paymentMethodLabel,
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "./_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Dashboard administrativo: KPIs, série temporal e quebras do período.
 * Spec: docs/modules/dashboard.md
 */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = dashboardFiltersSchema.parse(await searchParams);
  const stats = await getDashboardStats(filters);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Painel administrativo
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Dashboard</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Dados de {formatDate(stats.range.from)} a {formatDate(stats.range.to)}
            {stats.range.bucket === "month" && " · agregados por mês"}
          </p>
        </div>
        <DashboardPeriodFilter filters={filters} />
      </section>

      <Card>
        <DashboardMetricsChart
          series={stats.series}
          totals={stats.totals}
          previous={stats.previous}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-extrabold text-primary-700">
            Inscrições criadas no período
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Distribuição por status atual.</p>
          {stats.registrationsByStatus.length === 0 ? (
            <p className="mt-6 text-sm font-semibold text-ink-muted">
              Nenhuma inscrição criada no período.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {stats.registrationsByStatus.map(({ status, count }) => (
                <BreakdownBar
                  key={status}
                  value={count}
                  max={Math.max(...stats.registrationsByStatus.map((entry) => entry.count))}
                  label={
                    <StatusBadge tone={registrationStatusTone(status)}>
                      {registrationStatusLabel(status)}
                    </StatusBadge>
                  }
                  detail={`${count.toLocaleString("pt-BR")} ${count === 1 ? "inscrição" : "inscrições"}`}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-extrabold text-primary-700">
            Pagamentos confirmados por método
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Ticket médio no período:{" "}
            <span className="font-bold text-primary-700">
              {stats.totals.avgTicketCents !== null
                ? formatCentsBRL(stats.totals.avgTicketCents)
                : "—"}
            </span>
          </p>
          {stats.paymentsByMethod.length === 0 ? (
            <p className="mt-6 text-sm font-semibold text-ink-muted">
              Nenhum pagamento confirmado no período.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {stats.paymentsByMethod.map(({ method, count, amountCents }) => (
                <BreakdownBar
                  key={method}
                  value={amountCents}
                  max={Math.max(...stats.paymentsByMethod.map((entry) => entry.amountCents))}
                  label={
                    <span className="text-sm font-extrabold text-primary-700">
                      {paymentMethodLabel(method)}
                    </span>
                  }
                  detail={`${formatCentsBRL(amountCents)} · ${count.toLocaleString("pt-BR")} ${
                    count === 1 ? "cobrança" : "cobranças"
                  }`}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Barra horizontal das quebras (status / método de pagamento). */
function BreakdownBar({
  label,
  detail,
  value,
  max,
}: {
  label: React.ReactNode;
  detail: string;
  value: number;
  max: number;
}) {
  const percent = max > 0 ? Math.max(2, (value / max) * 100) : 0;

  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        {label}
        <span className="text-sm font-semibold text-ink-muted">{detail}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-primary-50">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}

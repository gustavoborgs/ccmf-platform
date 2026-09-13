import type { PaymentMethod, RegistrationStatus } from "@/generated/prisma/enums";

/**
 * Tipos do dashboard compartilhados entre service (server) e componentes
 * (client). Não importar nada com efeito server-side aqui.
 * Spec: docs/modules/dashboard.md
 */

export type DashboardBucket = "day" | "month";

export type DashboardSeriesPoint = {
  /** chave do bucket: yyyy-mm-dd (dia) ou yyyy-mm (mês) */
  key: string;
  /** rótulo curto pt-BR para eixo/tooltip (ex.: "13/09" ou "set/26") */
  label: string;
  revenueCents: number;
  paidRegistrations: number;
  newRegistrations: number;
  newLeads: number;
};

export type DashboardTotals = {
  revenueCents: number;
  paidRegistrations: number;
  newRegistrations: number;
  newLeads: number;
};

export type DashboardStats = {
  range: { from: Date; to: Date; bucket: DashboardBucket };
  totals: DashboardTotals & { avgTicketCents: number | null };
  /** janela imediatamente anterior de mesma duração; null no preset "all" */
  previous: DashboardTotals | null;
  series: DashboardSeriesPoint[];
  /** inscrições criadas no período, por status (só status com contagem > 0) */
  registrationsByStatus: { status: RegistrationStatus; count: number }[];
  /** pagamentos confirmados no período, por método */
  paymentsByMethod: { method: PaymentMethod; count: number; amountCents: number }[];
};

import type { ReactNode } from "react";
import { cn } from "@/shared/ui";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warning" | "success" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-primary-50 text-primary-700",
    warning: "bg-yellow-50 text-yellow-800",
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

/** Bloco de seção dos modais de detalhe das listagens administrativas. */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary-700/70">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Grade label/valor usada dentro de DetailSection. */
export function DetailGrid({
  items,
  className,
}: {
  items: [string, string][];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-extrabold uppercase tracking-wide text-primary-700/60">
            {label}
          </dt>
          <dd className="mt-1 text-sm text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function registrationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    PENDING_PAYMENT: "Aguardando pagamento",
    PAID: "Pagamento confirmado",
    UNDER_REVIEW: "Em análise",
    APPROVED: "Aprovada",
    REJECTED: "Recusada",
    SEMIFINALIST: "Semifinalista",
    WINNER: "Vencedora",
  };
  return labels[status] ?? status;
}

export function registrationStatusTone(status: string): Parameters<typeof StatusBadge>[0]["tone"] {
  if (status === "REJECTED") return "danger";
  if (status === "PENDING_PAYMENT" || status === "DRAFT") return "warning";
  if (status === "PAID" || status === "UNDER_REVIEW") return "info";
  if (status === "APPROVED" || status === "SEMIFINALIST" || status === "WINNER") return "success";
  return "neutral";
}

export function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    RECEIVED: "Recebido",
    OVERDUE: "Vencido",
    REFUNDED: "Reembolsado",
    CANCELED: "Cancelado",
    FAILED: "Falhou",
  };
  return labels[status] ?? status;
}

export function paymentStatusTone(status: string): Parameters<typeof StatusBadge>[0]["tone"] {
  if (status === "CONFIRMED" || status === "RECEIVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "OVERDUE" || status === "FAILED" || status === "CANCELED") return "danger";
  if (status === "REFUNDED") return "info";
  return "neutral";
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    PIX: "PIX",
    BOLETO: "Boleto",
    CREDIT_CARD: "Cartão",
  };
  return labels[method] ?? method;
}

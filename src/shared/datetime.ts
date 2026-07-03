/** Fuso horário padrão da plataforma (exibição e referência operacional). */
export const APP_TIMEZONE = "America/Sao_Paulo";

export function formatDateTimeBR(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatDateBR(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatPostDateBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

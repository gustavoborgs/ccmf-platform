import type { ContestStatusValue } from "./validators";

/**
 * Rótulos pt-BR da máquina de estados da edição
 * (docs/03-modelo-de-dados.md → Contest.status).
 */

export const CONTEST_STATUS_LABELS: Record<ContestStatusValue, string> = {
  DRAFT: "Rascunho",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  JUDGING: "Em julgamento",
  RESULTS_PUBLISHED: "Resultados publicados",
  ARCHIVED: "Arquivada",
};

export function contestStatusLabel(status: string): string {
  return CONTEST_STATUS_LABELS[status as ContestStatusValue] ?? status;
}

export function contestStatusTone(
  status: string,
): "neutral" | "warning" | "success" | "danger" | "info" {
  if (status === "REGISTRATION_OPEN") return "success";
  if (status === "REGISTRATION_CLOSED") return "warning";
  if (status === "JUDGING") return "info";
  if (status === "RESULTS_PUBLISHED") return "info";
  return "neutral";
}

/** Descrição curta de cada etapa, usada no controle de status. */
export const CONTEST_STATUS_HINTS: Record<ContestStatusValue, string> = {
  DRAFT: "Edição em preparação, invisível ao público.",
  REGISTRATION_OPEN: "Wizard de inscrição aberto. Só uma edição por vez.",
  REGISTRATION_CLOSED: "Inscrições encerradas; pagas seguem o fluxo normal.",
  JUDGING: "Jurados votando (rodadas 1 e 2).",
  RESULTS_PUBLISHED: "Resultados visíveis nas páginas públicas.",
  ARCHIVED: "Edição finalizada e arquivada.",
};

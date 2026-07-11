import type { ContestStatus, Gender, RegistrationStatus } from "@/generated/prisma/client";

/**
 * Formatação da exibição pública de participantes.
 * Regra de privacidade (spec): somente primeiro nome + sobrenome.
 */

/** "Maria Clara dos Santos Oliveira" → "Maria Oliveira" */
export function publicDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/** Selo público de destaque (somente semifinalistas e vencedores). */
export function publicStatusBadge(
  status: RegistrationStatus,
  gender: Gender | null,
): { label: string; tone: "winner" | "semifinalist" } | null {
  if (status === "WINNER") {
    return {
      label: gender === "FEMALE" ? "Vencedora" : gender === "MALE" ? "Vencedor" : "Vencedor(a)",
      tone: "winner",
    };
  }
  if (status === "SEMIFINALIST") {
    return { label: "Semifinalista", tone: "semifinalist" };
  }
  return null;
}

/** Com resultados publicados, só vencedores permanecem a cores na galeria e no perfil. */
export function shouldGrayscalePublicPhoto(
  contestStatus: ContestStatus | string,
  registrationStatus: RegistrationStatus | string,
): boolean {
  return contestStatus === "RESULTS_PUBLISHED" && registrationStatus !== "WINNER";
}

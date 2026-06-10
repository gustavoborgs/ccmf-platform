/** Helpers de domínio compartilhados entre módulos. */

/**
 * Padrão de imagem da plataforma: retrato 3:4.
 * Vale para fotos de participantes (crop no frontend) e para a moldura.
 */
export const PHOTO_ASPECT = { width: 3, height: 4 } as const;

/** Tolerância de 2% para arredondamentos do crop no client. */
export function isValidPhotoAspect(width: number, height: number): boolean {
  const expected = PHOTO_ASPECT.width / PHOTO_ASPECT.height;
  return Math.abs(width / height - expected) <= expected * 0.02;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Idade em meses completos na data de referência (regra das categorias). */
export function ageInMonths(birthDate: Date, reference: Date = new Date()): number {
  let months =
    (reference.getFullYear() - birthDate.getFullYear()) * 12 +
    (reference.getMonth() - birthDate.getMonth());
  if (reference.getDate() < birthDate.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Protocolo legível da inscrição, ex.: CCMF-2026-000123 */
export function buildProtocol(year: number, sequence: number): string {
  return `CCMF-${year}-${String(sequence).padStart(6, "0")}`;
}

/** a***@gmail.com — exibição de dados do lead no link de retomada. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

/** (43) 9****-**29 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `(${digits.slice(0, 2)}) ****-**${digits.slice(-2)}`;
}

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** 8 → "8 meses" · 24 → "2 anos" · 30 → "2 anos e 6 meses" */
export function formatAgeMonths(months: number): string {
  if (months < 24) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} anos`;
  return `${years} anos e ${rest} ${rest === 1 ? "mês" : "meses"}`;
}

/** Faixa etária legível de uma categoria, ex.: "11 meses a 2 anos". */
export function formatAgeRange(minMonths: number, maxMonths: number): string {
  return `${formatAgeMonths(minMonths)} a ${formatAgeMonths(maxMonths)}`;
}

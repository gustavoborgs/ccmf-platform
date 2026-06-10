import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Schemas Zod do módulo Contests (edições e categorias).
 * Spec: docs/modules/contests.md
 */

export const CONTEST_STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "JUDGING",
  "RESULTS_PUBLISHED",
  "ARCHIVED",
] as const;

export type ContestStatusValue = (typeof CONTEST_STATUSES)[number];

// ── Listagem administrativa (searchParams) ───────────────────────────

export const adminContestFiltersSchema = z.object({
  q: textParam,
  status: enumParam(CONTEST_STATUSES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminContestFilters = z.infer<typeof adminContestFiltersSchema>;

// ── Edição (Contest) ─────────────────────────────────────────────────

export const contestFormSchema = z.object({
  year: z
    .number({ message: "Informe o ano da edição." })
    .int("Ano inválido.")
    .min(2000, "Ano inválido.")
    .max(2100, "Ano inválido."),
  name: z
    .string({ message: "Informe o nome da edição." })
    .trim()
    .min(3, "O nome precisa de pelo menos 3 caracteres.")
    .max(120, "Nome muito longo."),
  /** Dinheiro sempre em centavos — conversão de reais acontece na UI. */
  registrationFeeCents: z
    .number({ message: "Informe a taxa de inscrição." })
    .int("Taxa inválida.")
    .min(0, "A taxa não pode ser negativa.")
    .max(100_000_00, "Taxa muito alta."),
  revealAt: z.coerce.date({ message: "Data da live inválida." }).nullable(),
  frameImageKey: z
    .string()
    .trim()
    .max(255, "Chave da moldura muito longa.")
    .transform((value) => (value ? value : null))
    .nullable(),
  regulationMd: z
    .string()
    .trim()
    .max(100_000, "Regulamento muito longo.")
    .transform((value) => (value ? value : null))
    .nullable(),
});

export type ContestFormInput = z.infer<typeof contestFormSchema>;

export const contestStatusUpdateSchema = z.object({
  contestId: z.string().min(1),
  status: z.enum(CONTEST_STATUSES),
});

// ── Categoria (faixa etária em meses) ────────────────────────────────

export const categoryFormSchema = z
  .object({
    name: z
      .string({ message: "Informe o nome da categoria." })
      .trim()
      .min(2, "O nome precisa de pelo menos 2 caracteres.")
      .max(80, "Nome muito longo."),
    minAgeMonths: z
      .number({ message: "Informe a idade mínima em meses." })
      .int("Idade mínima inválida.")
      .min(0, "A idade mínima não pode ser negativa.")
      .max(240, "Idade mínima acima do limite (240 meses)."),
    maxAgeMonths: z
      .number({ message: "Informe a idade máxima em meses." })
      .int("Idade máxima inválida.")
      .min(0, "A idade máxima não pode ser negativa.")
      .max(240, "Idade máxima acima do limite (240 meses)."),
  })
  .refine((data) => data.maxAgeMonths >= data.minAgeMonths, {
    message: "A idade máxima precisa ser maior ou igual à mínima.",
    path: ["maxAgeMonths"],
  });

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const createCategorySchema = z.object({
  contestId: z.string().min(1),
  category: categoryFormSchema,
});

export const updateCategorySchema = z.object({
  categoryId: z.string().min(1),
  category: categoryFormSchema,
});

export const moveCategorySchema = z.object({
  categoryId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

import { z } from "zod";

/**
 * Helpers para listagens administrativas: validação de searchParams
 * (filtros/paginação) e resolução de página. Usados pelos `validators.ts`
 * e `service.ts` dos módulos — par do kit `shared/ui/data-table`.
 */

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** Texto opcional: pega o primeiro valor, trim e vazio → undefined. */
export const textParam = z
  .preprocess(firstValue, z.string().optional())
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

/** Inteiro positivo opcional (ex.: ano da edição); inválido → undefined. */
export const positiveIntParam = z.preprocess(
  firstValue,
  z.coerce.number().int().positive().optional().catch(undefined),
);

/** Página atual (mínimo 1; inválido → 1). */
export const pageParam = z.preprocess(firstValue, z.coerce.number().int().min(1).catch(1));

/** Volume por página (1..100; inválido → 20). */
export const pageSizeParam = z.preprocess(
  firstValue,
  z.coerce.number().int().min(1).max(100).catch(20),
);

/** Enum opcional a partir de uma lista de valores; inválido → undefined. */
export function enumParam<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(firstValue, z.enum(values).optional().catch(undefined));
}

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Normaliza a página pedida contra o total (página além do fim volta para a
 * última) e devolve o `skip` da consulta junto com os metadados de paginação.
 */
export function resolvePagination(
  total: number,
  requestedPage: number,
  pageSize: number,
): PaginationMeta & { skip: number } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  return { page, pageSize, total, totalPages, skip: (page - 1) * pageSize };
}

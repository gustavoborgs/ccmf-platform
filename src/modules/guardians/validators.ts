import { z } from "zod";
import { pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Filtros administrativos de responsáveis.
 * Spec: docs/modules/guardians.md
 */

export const adminGuardianFiltersSchema = z.object({
  q: textParam,
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminGuardianFilters = z.infer<typeof adminGuardianFiltersSchema>;

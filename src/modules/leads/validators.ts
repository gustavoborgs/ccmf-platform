import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";

/**
 * Filtros do CRM de leads (`/admin/leads`).
 * Spec: docs/modules/leads.md
 *
 * As etapas espelham o funil: PRE_ACCOUNT vem de `Lead`; as demais são
 * derivadas de Registration via `getEnrollmentFunnel` (nada persistido).
 */

export const CRM_STAGES = [
  "PRE_ACCOUNT",
  "PENDING_PHOTOS",
  "READY_FOR_CHECKOUT",
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const adminLeadFiltersSchema = z.object({
  q: textParam,
  stage: enumParam(CRM_STAGES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminLeadFilters = z.infer<typeof adminLeadFiltersSchema>;

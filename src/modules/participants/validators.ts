import { z } from "zod";
import {
  enumParam,
  pageParam,
  pageSizeParam,
  positiveIntParam,
  textParam,
} from "@/shared/list-params";

/**
 * Filtros administrativos e públicos de participantes.
 * Specs: docs/modules/guardians.md e docs/modules/participants.md
 */

/** Filtros da galeria pública (`/participantes/[ano]`). */
export const publicGalleryFiltersSchema = z.object({
  q: textParam,
  categorySlug: textParam,
});

export type PublicGalleryFilters = z.infer<typeof publicGalleryFiltersSchema>;

/** Like anônimo na página do participante. */
export const likeInputSchema = z.object({
  registrationId: z.string().min(1, "Inscrição inválida."),
});

export const ADMIN_REGISTRATION_STATUSES = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAID",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SEMIFINALIST",
  "WINNER",
] as const;

export const adminParticipantFiltersSchema = z.object({
  q: textParam,
  year: positiveIntParam,
  categoryId: textParam,
  status: enumParam(ADMIN_REGISTRATION_STATUSES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export type AdminParticipantFilters = z.infer<typeof adminParticipantFiltersSchema>;
export type AdminRegistrationStatus = (typeof ADMIN_REGISTRATION_STATUSES)[number];

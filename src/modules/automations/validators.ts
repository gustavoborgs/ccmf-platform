import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";
import { registrationResumeWhatsappConfigSchema } from "./registration-resume-whatsapp/validators";

/**
 * Schemas compartilhados do módulo Automations.
 * Spec: docs/modules/automations.md
 */

export const AUTOMATION_TYPES = ["REGISTRATION_RESUME_WHATSAPP"] as const;
export const AUTOMATION_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;

export const adminAutomationLogFiltersSchema = z.object({
  q: textParam,
  type: enumParam(AUTOMATION_TYPES),
  status: enumParam(AUTOMATION_STATUSES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export const adminAutomationUpdateSchema = z.object({
  enabled: z.boolean(),
  config: registrationResumeWhatsappConfigSchema,
});

export type AdminAutomationLogFilters = z.infer<typeof adminAutomationLogFiltersSchema>;
export type AdminAutomationUpdateInput = z.infer<typeof adminAutomationUpdateSchema>;

export {
  runRegistrationResumeWorkerSchema,
  type RunRegistrationResumeWorkerInput,
} from "./registration-resume-whatsapp/validators";

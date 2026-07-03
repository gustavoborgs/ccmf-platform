import { z } from "zod";
import { enumParam, pageParam, pageSizeParam, textParam } from "@/shared/list-params";
import {
  AUTOMATION_DELAY_ANCHORS,
  AUTOMATION_EVENTS,
  AUTOMATION_FUNNEL_STEPS,
  AUTOMATION_TEMPLATE_VARIABLES,
  sortTemplateBindings,
  type AutomationTemplateBinding,
} from "./types";

/**
 * Schemas compartilhados do módulo Automations.
 * Spec: docs/modules/automations.md
 */

export const automationTemplateBindingSchema = z.object({
  variable: z.enum(AUTOMATION_TEMPLATE_VARIABLES),
  position: z.number().int().min(1).max(20),
});

function normalizeTemplateBindings(
  bindings: AutomationTemplateBinding[],
  ctx: z.RefinementCtx,
): AutomationTemplateBinding[] {
  const sorted = sortTemplateBindings(bindings);
  const positions = new Set<number>();
  const variables = new Set<string>();

  for (const binding of sorted) {
    if (positions.has(binding.position)) {
      ctx.addIssue({
        code: "custom",
        message: `Posição ${binding.position} duplicada nos parâmetros do template.`,
        path: ["templateBindings"],
      });
    }
    positions.add(binding.position);

    if (variables.has(binding.variable)) {
      ctx.addIssue({
        code: "custom",
        message: `Variável "${binding.variable}" repetida nos parâmetros do template.`,
        path: ["templateBindings"],
      });
    }
    variables.add(binding.variable);
  }

  return sorted;
}

const automationConfigBaseSchema = z.object({
  templateId: z.string().uuid("templateId deve ser um UUID válido."),
  batchLimit: z.number().int().min(1).max(100).default(50),
  templateBindings: z.array(automationTemplateBindingSchema).min(1),
  delayHours: z.number().min(0.25).max(168),
});

export const automationScheduledConfigSchema = automationConfigBaseSchema
  .extend({
    trigger: z.literal("SCHEDULED"),
    delayAnchor: z.enum(AUTOMATION_DELAY_ANCHORS),
    funnelStep: z.enum(AUTOMATION_FUNNEL_STEPS),
  })
  .superRefine((config, ctx) => {
    normalizeTemplateBindings(config.templateBindings, ctx);
  });

export const automationEventConfigSchema = automationConfigBaseSchema
  .extend({
    trigger: z.literal("EVENT"),
    event: z.enum(AUTOMATION_EVENTS),
    delayAnchor: z.enum(AUTOMATION_DELAY_ANCHORS).default("ENTITY_CREATED"),
    batchLimit: z.number().int().min(1).max(100).optional(),
  })
  .superRefine((config, ctx) => {
    normalizeTemplateBindings(config.templateBindings, ctx);
  });

export const automationConfigSchema = z.discriminatedUnion("trigger", [
  automationScheduledConfigSchema,
  automationEventConfigSchema,
]);

export const AUTOMATION_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;

export const adminAutomationLogFiltersSchema = z.object({
  q: textParam,
  automationId: textParam,
  status: enumParam(AUTOMATION_STATUSES),
  page: pageParam,
  pageSize: pageSizeParam,
});

export const adminAutomationCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  enabled: z.boolean().default(true),
  config: automationConfigSchema,
});

export const adminAutomationUpdateSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  enabled: z.boolean(),
  config: automationConfigSchema,
});

export const runAutomationsWorkerSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    dryRun: z.boolean().optional(),
  })
  .optional()
  .default({});

export type AdminAutomationLogFilters = z.infer<typeof adminAutomationLogFiltersSchema>;
export type AdminAutomationCreateInput = z.infer<typeof adminAutomationCreateSchema>;
export type AdminAutomationUpdateInput = z.infer<typeof adminAutomationUpdateSchema>;
export type RunAutomationsWorkerInput = z.infer<typeof runAutomationsWorkerSchema>;

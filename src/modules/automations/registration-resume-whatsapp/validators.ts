import { z } from "zod";

export const registrationResumeWhatsappConfigSchema = z.object({
  templateId: z.string().uuid("templateId deve ser um UUID válido."),
  delayHours: z.number().int().min(1).max(168),
  batchLimit: z.number().int().min(1).max(100),
});

export const runRegistrationResumeWorkerSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
    dryRun: z.boolean().optional(),
  })
  .optional()
  .default({});

export type RunRegistrationResumeWorkerInput = z.infer<typeof runRegistrationResumeWorkerSchema>;

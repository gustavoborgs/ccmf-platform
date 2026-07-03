import type { AutomationChannel, AutomationType } from "@/generated/prisma/client";
import type { z } from "zod";
import type { automationConfigSchema } from "./validators";

export type AutomationConfig = z.infer<typeof automationConfigSchema>;

export const AUTOMATION_FUNNEL_STEPS = [
  "PRE_ACCOUNT",
  "PENDING_PHOTOS",
  "READY_FOR_CHECKOUT",
  "PAYMENT_PENDING",
] as const;

export const AUTOMATION_EVENTS = ["PAYMENT_CONFIRMED", "REGISTRATION_APPROVED"] as const;

export const AUTOMATION_TRIGGERS = ["SCHEDULED", "EVENT"] as const;

export const AUTOMATION_DELAY_ANCHORS = ["STEP_ENTERED", "ENTITY_CREATED"] as const;

export const AUTOMATION_TEMPLATE_VARIABLES = [
  "guardianName",
  "participantName",
  "protocol",
  "categoryName",
  "contestYear",
  "resumeUrl",
  "participantProfileUrl",
  "referralCode",
  "referralUrl",
  "accountUrl",
  "trainingUrl",
] as const;

export type AutomationFunnelStep = (typeof AUTOMATION_FUNNEL_STEPS)[number];
export type AutomationEvent = (typeof AUTOMATION_EVENTS)[number];
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];
export type AutomationDelayAnchor = (typeof AUTOMATION_DELAY_ANCHORS)[number];
export type AutomationTemplateVariable = (typeof AUTOMATION_TEMPLATE_VARIABLES)[number];

export type AutomationTemplateBinding = {
  variable: AutomationTemplateVariable;
  position: number;
};

export const AUTOMATION_TYPE_LABELS: Record<AutomationType, string> = {
  WHATSAPP: "WhatsApp",
  REGISTRATION_RESUME_WHATSAPP: "WhatsApp",
};

export const AUTOMATION_CHANNEL_LABELS: Record<AutomationChannel, string> = {
  WHATSAPP: "WhatsApp",
};

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  SCHEDULED: "Agendado (worker)",
  EVENT: "Evento (reativo)",
};

export const AUTOMATION_FUNNEL_STEP_LABELS: Record<AutomationFunnelStep, string> = {
  PRE_ACCOUNT: "Pré-conta (Lead)",
  PENDING_PHOTOS: "Fotos pendentes",
  READY_FOR_CHECKOUT: "Pronto para pagamento",
  PAYMENT_PENDING: "Aguardando pagamento",
};

export const AUTOMATION_EVENT_LABELS: Record<AutomationEvent, string> = {
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  REGISTRATION_APPROVED: "Inscrição aprovada",
};

export const AUTOMATION_DELAY_ANCHOR_LABELS: Record<AutomationDelayAnchor, string> = {
  STEP_ENTERED: "Desde entrada na etapa",
  ENTITY_CREATED: "Desde criação do registro",
};

export const AUTOMATION_TEMPLATE_VARIABLE_LABELS: Record<AutomationTemplateVariable, string> = {
  guardianName: "Nome do responsável",
  participantName: "Nome do participante",
  protocol: "Protocolo da inscrição",
  categoryName: "Categoria",
  contestYear: "Ano da edição",
  resumeUrl: "Link de retomada",
  participantProfileUrl: "Link do perfil público",
  referralCode: "Código de indicação",
  referralUrl: "Link de indicação",
  accountUrl: "Link da área logada (/conta)",
  trainingUrl: "Link do curso (/conta/formacao)",
};

/** Variáveis disponíveis por contexto do alvo. */
export const AUTOMATION_VARIABLE_AVAILABILITY: Record<
  AutomationTemplateVariable,
  { lead: boolean; registration: boolean; note?: string }
> = {
  guardianName: { lead: true, registration: true },
  participantName: { lead: false, registration: true },
  protocol: { lead: false, registration: true },
  categoryName: { lead: false, registration: true },
  contestYear: { lead: false, registration: true },
  resumeUrl: { lead: true, registration: true },
  participantProfileUrl: {
    lead: false,
    registration: true,
    note: "Vazio até a inscrição ser aprovada/publicada.",
  },
  referralCode: { lead: false, registration: true },
  referralUrl: { lead: false, registration: true },
  accountUrl: { lead: false, registration: true },
  trainingUrl: { lead: false, registration: true, note: "Útil após pagamento confirmado." },
};

export function describeAutomationConfig(config: AutomationConfig): string {
  if (config.trigger === "EVENT") {
    const delay = config.delayHours > 0 ? ` · ${config.delayHours}h após` : "";
    return `${AUTOMATION_TRIGGER_LABELS.EVENT}: ${AUTOMATION_EVENT_LABELS[config.event]}${delay}`;
  }

  const step =
    config.funnelStep != null
      ? AUTOMATION_FUNNEL_STEP_LABELS[config.funnelStep]
      : config.statuses?.length
        ? `Status: ${config.statuses.join(", ")}`
        : "Qualquer abandono";

  return `${AUTOMATION_TRIGGER_LABELS.SCHEDULED}: ${step} · ${config.delayHours}h · ${AUTOMATION_DELAY_ANCHOR_LABELS[config.delayAnchor]}`;
}

export function sortTemplateBindings(bindings: AutomationTemplateBinding[]): AutomationTemplateBinding[] {
  return [...bindings].sort((a, b) => a.position - b.position);
}

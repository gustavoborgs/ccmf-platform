import type { AutomationType } from "@/generated/prisma/client";
import type { RegistrationResumeWhatsappConfig } from "./registration-resume-whatsapp/types";

/**
 * Mapa de configuração tipada por automação.
 * Ao adicionar um novo `AutomationType`, declare o shape aqui e o parser em `parseAutomationConfig`.
 */
export type AutomationConfigByType = {
  REGISTRATION_RESUME_WHATSAPP: RegistrationResumeWhatsappConfig;
};

export type AutomationConfig<T extends AutomationType = AutomationType> =
  AutomationConfigByType[T];

export const AUTOMATION_TYPE_LABELS: Record<AutomationType, string> = {
  REGISTRATION_RESUME_WHATSAPP: "Retomada de inscrição",
};

export const AUTOMATION_CHANNEL_LABELS = {
  WHATSAPP: "WhatsApp",
} as const;

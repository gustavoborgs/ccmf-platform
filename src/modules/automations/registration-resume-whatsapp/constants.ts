import type { RegistrationResumeWhatsappConfig } from "./types";

export const REGISTRATION_RESUME_WHATSAPP_TYPE = "REGISTRATION_RESUME_WHATSAPP" as const;

/** Defaults usados apenas em seed/migration. Runtime lê de `Automation.config` no banco. */
export const DEFAULT_REGISTRATION_RESUME_WHATSAPP_CONFIG: RegistrationResumeWhatsappConfig = {
  templateId: "532e7a0c-1380-4001-aa2b-94532c2cd750",
  delayHours: 1,
  batchLimit: 50,
};

export const REGISTRATION_RESUME_WHATSAPP_META = {
  name: "Retomada de inscrição via WhatsApp",
  description: "Envia link de retomada 1h após inscrição sem pagamento.",
} as const;

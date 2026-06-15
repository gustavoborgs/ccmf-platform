/** Configuração persistida em `Automation.config` para retomada de inscrição. */
export type RegistrationResumeWhatsappConfig = {
  templateId: string;
  delayHours: number;
  batchLimit: number;
};

export type RegistrationResumeWorkerResult = {
  ok: boolean;
  dryRun: boolean;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  batchId: string | null;
  error?: string;
};

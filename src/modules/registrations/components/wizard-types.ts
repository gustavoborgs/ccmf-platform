/** Tipos compartilhados do wizard — arquivo sem "use client" para import seguro no servidor. */

export type WizardUiStep = "guardian" | "participant" | "photos" | "summary";

export type WizardInitialState = {
  step: WizardUiStep;
  registrationId: string | null;
  photosCount: number;
  paymentPending: boolean;
  prefill?: { name?: string; emailMasked?: string; phoneMasked?: string };
  summary: {
    protocol: string;
    participantName: string;
    categoryName: string;
    feeFormatted: string;
  } | null;
  feeFormatted: string;
};

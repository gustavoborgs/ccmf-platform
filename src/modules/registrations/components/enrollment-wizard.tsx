"use client";

import { useState } from "react";
import { cn } from "@/shared/ui/cn";
import { GuardianStep } from "./guardian-step";
import { ParticipantStep } from "./participant-step";
import { PhotosStep } from "./photos-step";
import { SummaryStep } from "./summary-step";
import type { WizardInitialState, WizardUiStep } from "./wizard-types";

export type { WizardInitialState, WizardUiStep } from "./wizard-types";

/**
 * Wizard de inscrição (3 steps). O andamento vive no ref assinado da URL
 * (?ref=) — recarregar ou compartilhar o link retoma do ponto certo.
 * Sem ref, começa do início. Spec: docs/modules/registrations.md
 */

const STEPS: { id: WizardUiStep | "payment"; label: string }[] = [
  { id: "guardian", label: "Responsável" },
  { id: "participant", label: "Participante" },
  { id: "summary", label: "Pagamento" },
];

function stepIndex(step: WizardUiStep): number {
  if (step === "guardian") return 0;
  if (step === "participant" || step === "photos") return 1;
  return 2;
}

/** Mantém o ref na URL sem recarregar a página (estado restaurável). */
function syncRefToUrl(ref: string | null) {
  const url = ref ? `/inscricao?ref=${encodeURIComponent(ref)}` : "/inscricao";
  window.history.replaceState(null, "", url);
}

export function EnrollmentWizard({ initial }: { initial: WizardInitialState }) {
  const [step, setStep] = useState<WizardUiStep>(initial.step);
  const [ref, setRef] = useState(initial.ref);
  const [registrationId, setRegistrationId] = useState(initial.registrationId);
  const [summary, setSummary] = useState(initial.summary);

  const currentIndex = stepIndex(step);

  function advanceRef(nextRef: string) {
    setRef(nextRef);
    syncRefToUrl(nextRef);
  }

  function restart() {
    setStep("guardian");
    setRef(null);
    setRegistrationId(null);
    setSummary(null);
    syncRefToUrl(null);
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Indicador de progresso */}
      <ol className="mb-8 flex items-center justify-between gap-2">
        {STEPS.map((item, index) => (
          <li key={item.id} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full font-display text-sm font-extrabold",
                index < currentIndex && "bg-primary-600 text-white",
                index === currentIndex && "bg-brand-gradient text-white shadow-brand",
                index > currentIndex && "bg-primary-100 text-primary-600",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                index === currentIndex ? "text-primary-800" : "text-ink-muted",
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="rounded-bubble border border-primary-100 bg-white p-6 shadow-brand sm:p-8">
        {step === "guardian" && (
          <GuardianStep
            prefill={initial.prefill}
            onDone={(nextRef) => {
              advanceRef(nextRef);
              setStep("participant");
            }}
          />
        )}

        {step === "participant" && (
          <ParticipantStep
            wizardRef={ref}
            onDone={(data) => {
              advanceRef(data.ref);
              setRegistrationId(data.registrationId);
              setSummary({
                protocol: data.protocol,
                participantName: data.participantName,
                categoryName: data.categoryName,
                feeFormatted: initial.feeFormatted,
              });
              setStep("photos");
            }}
          />
        )}

        {step === "photos" && registrationId && (
          <PhotosStep
            wizardRef={ref}
            registrationId={registrationId}
            initialCount={initial.registrationId === registrationId ? initial.photosCount : 0}
            onDone={() => setStep("summary")}
          />
        )}

        {step === "summary" && summary && registrationId && (
          <SummaryStep
            wizardRef={ref}
            registrationId={registrationId}
            summary={summary}
            paymentPending={initial.paymentPending && initial.registrationId === registrationId}
          />
        )}
      </div>

      {step !== "guardian" && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={restart}
            className="text-sm font-bold text-ink-muted underline-offset-4 transition hover:text-accent-700 hover:underline"
          >
            Começar uma nova inscrição do início
          </button>
          <p className="mt-1 text-xs text-ink-muted">
            Seu progresso atual fica salvo neste link — guarde a URL para retomar depois.
          </p>
        </div>
      )}
    </div>
  );
}

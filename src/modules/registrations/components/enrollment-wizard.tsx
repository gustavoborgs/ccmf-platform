"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/shared/analytics/events";
import { cn } from "@/shared/ui/cn";
import { WIZARD_REF_COOKIE, WIZARD_REF_MAX_AGE_SECONDS } from "../wizard-cookie";
import { REFERRAL_CODE_COOKIE, REFERRAL_CODE_MAX_AGE_SECONDS } from "@/modules/referrals/referral-cookie";
import { GuardianStep } from "./guardian-step";
import { ParticipantStep } from "./participant-step";
import { PhotosStep } from "./photos-step";
import { SummaryStep } from "./summary-step";
import type { WizardInitialState, WizardParticipantState, WizardUiStep } from "./wizard-types";

export type { WizardInitialState, WizardUiStep } from "./wizard-types";

/**
 * Wizard de inscrição (3 steps). O andamento vive no ref assinado da URL
 * (?ref=) e no cookie local de retomada. Spec: docs/modules/registrations.md
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
function syncRefToUrl(ref: string | null, referralCode: string | null = null) {
  syncReferralToUrl(ref, referralCode);
}

function rememberRef(ref: string) {
  document.cookie = `${WIZARD_REF_COOKIE}=${encodeURIComponent(ref)}; Max-Age=${WIZARD_REF_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

function forgetRef() {
  document.cookie = `${WIZARD_REF_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function rememberReferralCode(code: string) {
  document.cookie = `${REFERRAL_CODE_COOKIE}=${encodeURIComponent(code)}; Max-Age=${REFERRAL_CODE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

function forgetReferralCode() {
  document.cookie = `${REFERRAL_CODE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function syncReferralToUrl(ref: string | null, referralCode: string | null) {
  const params = new URLSearchParams();
  if (ref) params.set("ref", ref);
  if (referralCode) params.set("indicacao", referralCode);
  const query = params.toString();
  const url = query ? `/inscricao?${query}` : "/inscricao";
  window.history.replaceState(null, "", url);
}

export function EnrollmentWizard({ initial }: { initial: WizardInitialState }) {
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const [step, setStep] = useState<WizardUiStep>(initial.step);
  const [ref, setRef] = useState(initial.ref);
  const [registrationId, setRegistrationId] = useState(initial.registrationId);
  const [photosCount, setPhotosCount] = useState(initial.photosCount);
  const [participant, setParticipant] = useState<WizardParticipantState | undefined>(
    initial.participant,
  );
  const [summary, setSummary] = useState(initial.summary);
  const [referralCode, setReferralCode] = useState(initial.initialReferralCode ?? "");

  const currentIndex = stepIndex(step);
  const canEditDraft = !initial.paymentPending || initial.registrationId !== registrationId;

  useEffect(() => {
    if (!ref && !referralCode) return;
    syncRefToUrl(ref, referralCode || null);
    if (ref) rememberRef(ref);
    if (referralCode) rememberReferralCode(referralCode);
  }, [ref, referralCode]);

  useEffect(() => {
    trackEvent("enrollment_step_view", {
      step,
      step_number: currentIndex + 1,
      registration_resumed: Boolean(initial.ref),
    });
  }, [currentIndex, initial.ref, step]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    requestAnimationFrame(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [step]);

  function advanceRef(nextRef: string) {
    setRef(nextRef);
    syncRefToUrl(nextRef, referralCode || null);
    rememberRef(nextRef);
  }

  function handleReferralCodeChange(code: string) {
    setReferralCode(code);
    if (code) {
      rememberReferralCode(code);
    } else {
      forgetReferralCode();
    }
    syncRefToUrl(ref, code || null);
  }

  function restart() {
    setStep("guardian");
    setRef(null);
    setRegistrationId(null);
    setPhotosCount(0);
    setParticipant(undefined);
    setSummary(null);
    forgetRef();
    forgetReferralCode();
    setReferralCode("");
    syncRefToUrl(null, null);
  }

  function goToStep(target: WizardUiStep) {
    if (target === "guardian") {
      restart();
      return;
    }
    if (target === "participant" && ref && canEditDraft) {
      setStep("participant");
      return;
    }
    if (target === "photos" && registrationId && canEditDraft) {
      setStep("photos");
      return;
    }
    if (target === "summary" && summary && registrationId && photosCount >= 2) {
      setStep("summary");
    }
  }

  function canGoToStep(target: WizardUiStep | "payment") {
    if (target === "payment") return false;
    if (target === "guardian") return step !== "guardian";
    if (target === "participant") return Boolean(ref) && canEditDraft;
    if (target === "photos") return Boolean(registrationId) && canEditDraft;
    return Boolean(summary && registrationId && photosCount >= 2);
  }

  return (
    <div ref={wizardTopRef} className="mx-auto max-w-xl scroll-mt-24">
      {/* Indicador de progresso */}
      <ol className="mb-8 flex items-center justify-between gap-2">
        {STEPS.map((item, index) => (
          <li key={item.id} className="flex flex-1 flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={!canGoToStep(item.id)}
              onClick={() => item.id !== "payment" && goToStep(item.id)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full font-display text-sm font-extrabold transition",
                index < currentIndex && "bg-primary-600 text-white hover:bg-primary-700",
                index === currentIndex && "bg-brand-gradient text-white shadow-brand",
                index > currentIndex && "bg-primary-100 text-primary-600",
                !canGoToStep(item.id) && index !== currentIndex && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="sr-only">Ir para {item.label}</span>
              <span aria-hidden>{index + 1}</span>
            </button>
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
            registrationId={registrationId}
            initialParticipant={participant}
            initialReferralCode={referralCode || initial.initialReferralCode}
            onReferralCodeChange={handleReferralCodeChange}
            onDone={(data) => {
              advanceRef(data.ref);
              setRegistrationId(data.registrationId);
              setParticipant(data.participant);
              setSummary({
                protocol: data.protocol,
                participantName: data.participantName,
                categoryName: data.categoryName,
                feeFormatted: initial.feeFormatted,
                feeCents: initial.feeCents,
              });
              setStep("photos");
            }}
          />
        )}

        {step === "photos" && registrationId && (
          <PhotosStep
            wizardRef={ref}
            registrationId={registrationId}
            initialCount={initial.registrationId === registrationId ? photosCount : 0}
            onDone={() => {
              setPhotosCount(2);
              setStep("summary");
            }}
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

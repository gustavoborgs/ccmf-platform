"use client";

import { useState, useTransition } from "react";
import { trackEvent } from "@/shared/analytics/events";
import { Button } from "@/shared/ui/button";
import { Field, SelectInput, TextInput } from "@/shared/ui/field";
import { createParticipantAction, updateParticipantAction } from "../actions";
import type { WizardParticipantState } from "./wizard-types";

/** Step 2a — dados da criança; categoria resolvida pela idade no backend. */

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export function ParticipantStep({
  wizardRef,
  registrationId,
  initialParticipant,
  initialReferralCode,
  initialVoucherCode,
  nevoaSessionCode,
  onReferralCodeChange,
  onVoucherCodeChange,
  onDone,
}: {
  wizardRef: string | null;
  registrationId: string | null;
  initialParticipant?: WizardParticipantState;
  initialReferralCode?: string;
  initialVoucherCode?: string;
  nevoaSessionCode?: string | null;
  onReferralCodeChange?: (code: string) => void;
  onVoucherCodeChange?: (code: string) => void;
  onDone: (data: {
    ref: string;
    registrationId: string;
    protocol: string;
    categoryName: string;
    participantName: string;
    participant: WizardParticipantState;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: initialParticipant?.name ?? "",
    birthDate: initialParticipant?.birthDate ?? "",
    gender: initialParticipant?.gender ?? "",
    city: initialParticipant?.city ?? "",
    state: initialParticipant?.state ?? "",
  });
  const hasInitialCodes = Boolean(initialReferralCode || initialVoucherCode);
  const [showCodes, setShowCodes] = useState(hasInitialCodes);
  const [referralCode, setReferralCode] = useState(initialReferralCode ?? "");
  const [voucherCode, setVoucherCode] = useState(initialVoucherCode ?? "");
  const [consent, setConsent] = useState(Boolean(initialParticipant));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReferralChange(value: string) {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setReferralCode(normalized);
    onReferralCodeChange?.(normalized);
  }

  function handleVoucherChange(value: string) {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setVoucherCode(normalized);
    onVoucherCodeChange?.(normalized);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const input = {
        name: form.name,
        birthDate: form.birthDate,
        gender: form.gender || undefined,
        city: form.city,
        state: form.state,
        imageConsent: consent,
        ...(registrationId ? {} : { referralCode: referralCode || undefined }),
        ...(registrationId || !nevoaSessionCode ? {} : { nevoaSessionCode }),
      };
      const result = registrationId
        ? await updateParticipantAction(wizardRef, registrationId, input)
        : await createParticipantAction(wizardRef, input);
      if (result.ok) {
        trackEvent("registration_step_complete", {
          step: "participant",
          category_name: result.data.categoryName,
          participant_state: form.state,
          edited_existing: Boolean(registrationId),
          has_referral_code: Boolean(referralCode),
          has_voucher_code: Boolean(voucherCode),
        });
        onDone({
          ...result.data,
          participant: {
            name: form.name,
            birthDate: form.birthDate,
            gender: form.gender,
            city: form.city,
            state: form.state,
          },
        });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Nome completo da criança">
        <TextInput
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data de nascimento" hint="Define a categoria automaticamente.">
          <TextInput
            type="date"
            value={form.birthDate}
            onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
          />
        </Field>
        <Field label="Sexo (opcional)">
          <SelectInput
            value={form.gender}
            onChange={(event) => setForm({ ...form, gender: event.target.value })}
          >
            <option value="">Prefiro não informar</option>
            <option value="FEMALE">Menina</option>
            <option value="MALE">Menino</option>
          </SelectInput>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label="Cidade">
          <TextInput
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
        </Field>
        <Field label="UF">
          <SelectInput
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
          >
            <option value="">--</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
        {!showCodes ? (
          <button
            type="button"
            onClick={() => setShowCodes(true)}
            className="text-sm font-bold text-primary-700 underline-offset-4 hover:underline"
          >
            Tem cupom de desconto ou código de indicação?
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-display text-sm font-extrabold text-primary-800">
                Cupom ou indicação
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                São coisas diferentes: o cupom reduz o valor da taxa; a indicação dá curtidas a
                quem te convidou.
              </p>
            </div>

            <Field
              label="Cupom de desconto"
              hint="Opcional. Reduz o valor da taxa no pagamento. Não é o código de indicação."
            >
              <TextInput
                value={voucherCode}
                onChange={(event) => handleVoucherChange(event.target.value)}
                placeholder="Ex.: BEMVINDO10"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono uppercase"
              />
            </Field>

            {!registrationId && (
              <Field
                label="Código de indicação"
                hint="Opcional. Se alguém te indicou, informe aqui — não dá desconto no valor."
              >
                <TextInput
                  value={referralCode}
                  onChange={(event) => handleReferralChange(event.target.value)}
                  placeholder="Ex.: ABC12345"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
              </Field>
            )}
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 size-4 accent-accent-600"
        />
        <span className="text-sm text-ink">
          Autorizo o uso da imagem da criança para fins do concurso, conforme o{" "}
          <a href="/regulamento" target="_blank" className="font-bold text-accent-700 underline">
            regulamento
          </a>
          .
        </span>
      </label>

      <Button onClick={submit} disabled={pending}>
        {pending ? "Salvando..." : registrationId ? "Salvar alterações" : "Salvar e enviar fotos"}
      </Button>

      {error && <p className="text-sm font-semibold text-accent-700">{error}</p>}
    </div>
  );
}

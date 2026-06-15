"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { updateAutomationAction } from "@/modules/automations/actions";
import { Button, Field, TextInput } from "@/shared/ui";
import type { RegistrationResumeWhatsappConfig } from "../types";

export type RegistrationResumeWhatsappFormInitial = {
  id: string;
  enabled: boolean;
  config: RegistrationResumeWhatsappConfig;
};

export function RegistrationResumeWhatsappForm({
  initial,
}: {
  initial: RegistrationResumeWhatsappFormInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [templateId, setTemplateId] = useState(initial.config.templateId);
  const [delayHours, setDelayHours] = useState(String(initial.config.delayHours));
  const [batchLimit, setBatchLimit] = useState(String(initial.config.batchLimit));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedDelayHours = Number(delayHours);
    const parsedBatchLimit = Number(batchLimit);
    if (!Number.isInteger(parsedDelayHours) || parsedDelayHours < 1) {
      setError("Atraso inválido. Use um número inteiro de horas (mínimo 1).");
      return;
    }
    if (!Number.isInteger(parsedBatchLimit) || parsedBatchLimit < 1) {
      setError("Limite por execução inválido. Use um número inteiro (mínimo 1).");
      return;
    }

    startTransition(async () => {
      const result = await updateAutomationAction(initial.id, {
        enabled,
        config: {
          templateId: templateId.trim(),
          delayHours: parsedDelayHours,
          batchLimit: parsedBatchLimit,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          disabled={isPending}
          className="h-5 w-5 rounded border-primary-300 text-accent-600"
        />
        <span>
          <span className="block text-sm font-bold text-ink">Automação ativa</span>
          <span className="block text-xs text-ink-muted">
            Quando desligada, o worker não envia mensagens desta automação.
          </span>
        </span>
      </label>

      <Field
        label="Template ID (nevoa-manager)"
        hint="UUID do template de WhatsApp configurado no nevoa-manager."
      >
        <TextInput
          required
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          disabled={isPending}
          placeholder="fdb10260-ae1a-4a5e-aa42-647a5070e523"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Atraso (horas)" hint="Horas após a inscrição para disparar a mensagem.">
          <TextInput
            required
            type="number"
            min={1}
            max={168}
            step={1}
            value={delayHours}
            onChange={(event) => setDelayHours(event.target.value)}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Limite por execução"
          hint="Máximo de envios processados a cada chamada do worker."
        >
          <TextInput
            required
            type="number"
            min={1}
            max={100}
            step={1}
            value={batchLimit}
            onChange={(event) => setBatchLimit(event.target.value)}
            disabled={isPending}
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Configuração salva com sucesso.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar configuração"}
        </Button>
      </div>
    </form>
  );
}

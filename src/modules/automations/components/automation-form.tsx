"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createAutomationAction,
  deleteAutomationAction,
  updateAutomationAction,
} from "@/modules/automations/actions";
import type { AutomationConfig, AutomationTemplateBinding } from "@/modules/automations/types";
import {
  AUTOMATION_DELAY_ANCHOR_LABELS,
  AUTOMATION_DELAY_ANCHORS,
  AUTOMATION_EVENT_LABELS,
  AUTOMATION_EVENTS,
  AUTOMATION_FUNNEL_STEP_LABELS,
  AUTOMATION_FUNNEL_STEPS,
  AUTOMATION_TEMPLATE_VARIABLE_LABELS,
  AUTOMATION_TEMPLATE_VARIABLES,
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_TRIGGERS,
  AUTOMATION_VARIABLE_AVAILABILITY,
  sortTemplateBindings,
} from "@/modules/automations/types";
import { Button, Field, SelectInput, TextInput } from "@/shared/ui";

const REGISTRATION_STATUSES = ["DRAFT", "PENDING_PAYMENT"] as const;

export type AutomationFormInitial = {
  id?: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  config: AutomationConfig;
};

const DEFAULT_BINDINGS: AutomationTemplateBinding[] = [
  { variable: "guardianName", position: 1 },
  { variable: "resumeUrl", position: 2 },
];

const DEFAULT_CONFIG: AutomationConfig = {
  trigger: "SCHEDULED",
  templateId: "",
  batchLimit: 50,
  templateBindings: DEFAULT_BINDINGS,
  delayHours: 1,
  delayAnchor: "ENTITY_CREATED",
  funnelStep: "PENDING_PHOTOS",
};

function normalizeInitialBindings(config: AutomationConfig): AutomationTemplateBinding[] {
  if ("templateBindings" in config && config.templateBindings.length) {
    return sortTemplateBindings(config.templateBindings);
  }
  return DEFAULT_BINDINGS;
}

export function AutomationForm({ initial, mode }: { initial?: AutomationFormInitial; mode: "create" | "edit" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [trigger, setTrigger] = useState<AutomationConfig["trigger"]>(
    initial?.config.trigger ?? DEFAULT_CONFIG.trigger,
  );
  const [templateId, setTemplateId] = useState(initial?.config.templateId ?? "");
  const [delayHours, setDelayHours] = useState(String(initial?.config.delayHours ?? 1));
  const [batchLimit, setBatchLimit] = useState(String(initial?.config.batchLimit ?? 50));
  const [delayAnchor, setDelayAnchor] = useState(
    initial?.config.delayAnchor ?? DEFAULT_CONFIG.delayAnchor,
  );
  const [funnelStep, setFunnelStep] = useState(
    initial?.config.trigger === "SCHEDULED"
      ? (initial.config.funnelStep ?? "PENDING_PHOTOS")
      : "PENDING_PHOTOS",
  );
  const [useStatusFilter, setUseStatusFilter] = useState(
    initial?.config.trigger === "SCHEDULED" &&
      initial.config.funnelStep == null &&
      Boolean(initial.config.statuses?.length),
  );
  const [event, setEvent] = useState(
    initial?.config.trigger === "EVENT" ? initial.config.event : AUTOMATION_EVENTS[0],
  );
  const [templateBindings, setTemplateBindings] = useState<AutomationTemplateBinding[]>(
    initial ? normalizeInitialBindings(initial.config) : DEFAULT_BINDINGS,
  );

  function updateBinding(index: number, patch: Partial<AutomationTemplateBinding>) {
    setTemplateBindings((current) =>
      current.map((binding, bindingIndex) =>
        bindingIndex === index ? { ...binding, ...patch } : binding,
      ),
    );
  }

  function removeBinding(index: number) {
    setTemplateBindings((current) => current.filter((_, bindingIndex) => bindingIndex !== index));
  }

  function addBinding() {
    const used = new Set(templateBindings.map((binding) => binding.variable));
    const nextVariable = AUTOMATION_TEMPLATE_VARIABLES.find((variable) => !used.has(variable));
    if (!nextVariable) return;

    const nextPosition = Math.max(0, ...templateBindings.map((binding) => binding.position)) + 1;
    setTemplateBindings((current) => [
      ...current,
      { variable: nextVariable, position: nextPosition },
    ]);
  }

  function buildConfig(): AutomationConfig | null {
    const parsedDelayHours = Number(delayHours);
    const parsedBatchLimit = Number(batchLimit);
    const bindings = sortTemplateBindings(templateBindings);

    if (!Number.isFinite(parsedDelayHours) || parsedDelayHours < 0.25) {
      setError("Atraso inválido. Mínimo 0.25h (15 minutos).");
      return null;
    }
    if (!Number.isFinite(parsedBatchLimit) || parsedBatchLimit < 1) {
      setError("Limite por execução inválido.");
      return null;
    }
    if (!bindings.length) {
      setError("Adicione ao menos um parâmetro do template.");
      return null;
    }

    const positions = new Set(bindings.map((binding) => binding.position));
    if (positions.size !== bindings.length) {
      setError("Cada parâmetro precisa de uma posição única.");
      return null;
    }

    const variables = new Set(bindings.map((binding) => binding.variable));
    if (variables.size !== bindings.length) {
      setError("Não repita a mesma variável em posições diferentes.");
      return null;
    }

    if (trigger === "EVENT") {
      return {
        trigger: "EVENT",
        templateId: templateId.trim(),
        batchLimit: parsedBatchLimit,
        templateBindings: bindings,
        delayHours: parsedDelayHours,
        delayAnchor,
        event,
      };
    }

    return {
      trigger: "SCHEDULED",
      templateId: templateId.trim(),
      batchLimit: parsedBatchLimit,
      templateBindings: bindings,
      delayHours: parsedDelayHours,
      delayAnchor,
      funnelStep: useStatusFilter ? null : funnelStep,
      statuses: useStatusFilter ? [...REGISTRATION_STATUSES] : undefined,
    };
  }

  function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setSuccess(false);

    const config = buildConfig();
    if (!config) return;

    startTransition(async () => {
      if (mode === "create") {
        const result = await createAutomationAction({
          name: name.trim(),
          description: description.trim() || undefined,
          enabled,
          config,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/admin/automacoes/${result.id}`);
        router.refresh();
        return;
      }

      if (!initial?.id) return;

      const result = await updateAutomationAction(initial.id, {
        name: name.trim(),
        description: description.trim() || null,
        enabled,
        config,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm("Excluir esta automação? Logs de disparo também serão removidos.")) return;

    startTransition(async () => {
      const result = await deleteAutomationAction(initial.id!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/automacoes");
      router.refresh();
    });
  }

  const sortedPreview = sortTemplateBindings(templateBindings);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Nome">
        <TextInput required value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
      </Field>

      <Field label="Descrição" hint="Opcional — aparece na listagem.">
        <TextInput value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={isPending}
          className="h-5 w-5 rounded border-primary-300 text-accent-600"
        />
        <span>
          <span className="block text-sm font-bold text-ink">Automação ativa</span>
          <span className="block text-xs text-ink-muted">Quando desligada, não dispara mensagens.</span>
        </span>
      </label>

      <Field label="Gatilho">
        <SelectInput
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as AutomationConfig["trigger"])}
          disabled={isPending}
        >
          {AUTOMATION_TRIGGERS.map((value) => (
            <option key={value} value={value}>
              {AUTOMATION_TRIGGER_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>

      {trigger === "SCHEDULED" ? (
        <>
          <label className="flex items-center gap-3 rounded-2xl border border-primary-100 px-4 py-3">
            <input
              type="checkbox"
              checked={useStatusFilter}
              onChange={(e) => setUseStatusFilter(e.target.checked)}
              disabled={isPending}
              className="h-5 w-5 rounded border-primary-300 text-accent-600"
            />
            <span className="text-sm text-ink">
              Filtrar por status (DRAFT + PENDING_PAYMENT) em vez de etapa do funil
            </span>
          </label>

          {!useStatusFilter && (
            <Field label="Etapa do funil">
              <SelectInput
                value={funnelStep ?? ""}
                onChange={(e) => setFunnelStep(e.target.value as typeof funnelStep)}
                disabled={isPending}
              >
                {AUTOMATION_FUNNEL_STEPS.map((value) => (
                  <option key={value} value={value}>
                    {AUTOMATION_FUNNEL_STEP_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}

          <Field label="Referência de tempo">
            <SelectInput
              value={delayAnchor}
              onChange={(e) => setDelayAnchor(e.target.value as typeof delayAnchor)}
              disabled={isPending}
            >
              {AUTOMATION_DELAY_ANCHORS.map((value) => (
                <option key={value} value={value}>
                  {AUTOMATION_DELAY_ANCHOR_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Limite por execução" hint="Máximo de envios por chamada do worker.">
            <TextInput
              required
              type="number"
              min={1}
              max={100}
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              disabled={isPending}
            />
          </Field>
        </>
      ) : (
        <Field label="Evento">
          <SelectInput
            value={event}
            onChange={(e) => setEvent(e.target.value as typeof event)}
            disabled={isPending}
          >
            {AUTOMATION_EVENTS.map((value) => (
              <option key={value} value={value}>
                {AUTOMATION_EVENT_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}

      <Field label="Atraso (horas)" hint="Mínimo 0.25 (15 min). Para eventos, 0 = imediato.">
        <TextInput
          required
          type="number"
          min={0}
          max={168}
          step={0.25}
          value={delayHours}
          onChange={(e) => setDelayHours(e.target.value)}
          disabled={isPending}
        />
      </Field>

      <Field label="Template ID (nevoa-manager)" hint="UUID do template de WhatsApp.">
        <TextInput
          required
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          disabled={isPending}
          placeholder="532e7a0c-1380-4001-aa2b-94532c2cd750"
        />
      </Field>

      <Field
        label="Parâmetros do template (API)"
        hint="Posição define a ordem enviada ao nevoa-manager ({{1}}, {{2}}, …)."
      >
        <div className="space-y-3 rounded-2xl border border-primary-100 p-4">
          {templateBindings.map((binding, index) => {
            const meta = AUTOMATION_VARIABLE_AVAILABILITY[binding.variable];
            return (
              <div
                key={`${binding.variable}-${index}`}
                className="grid gap-3 rounded-xl border border-primary-50 bg-primary-50/30 p-3 sm:grid-cols-[88px_1fr_auto]"
              >
                <Field label="Posição">
                  <TextInput
                    type="number"
                    min={1}
                    max={20}
                    value={String(binding.position)}
                    onChange={(e) =>
                      updateBinding(index, { position: Number.parseInt(e.target.value, 10) || 1 })
                    }
                    disabled={isPending}
                  />
                </Field>

                <Field label="Variável">
                  <SelectInput
                    value={binding.variable}
                    onChange={(e) =>
                      updateBinding(index, {
                        variable: e.target.value as AutomationTemplateBinding["variable"],
                      })
                    }
                    disabled={isPending}
                  >
                    {AUTOMATION_TEMPLATE_VARIABLES.map((variable) => (
                      <option key={variable} value={variable}>
                        {AUTOMATION_TEMPLATE_VARIABLE_LABELS[variable]}
                      </option>
                    ))}
                  </SelectInput>
                  {meta.note && <span className="mt-1 block text-xs text-ink-muted">{meta.note}</span>}
                </Field>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || templateBindings.length <= 1}
                    onClick={() => removeBinding(index)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || templateBindings.length >= AUTOMATION_TEMPLATE_VARIABLES.length}
            onClick={addBinding}
          >
            Adicionar parâmetro
          </Button>

          {sortedPreview.length > 0 && (
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-ink-muted">
              <p className="font-bold text-ink">Ordem enviada à API</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {sortedPreview.map((binding) => (
                  <li key={`${binding.position}-${binding.variable}`}>
                    {binding.position}. {AUTOMATION_TEMPLATE_VARIABLE_LABELS[binding.variable]}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </Field>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Configuração salva com sucesso.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        {mode === "edit" && initial?.id ? (
          <Button type="button" variant="ghost" disabled={isPending} onClick={handleDelete}>
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : mode === "create" ? "Criar automação" : "Salvar configuração"}
        </Button>
      </div>
    </form>
  );
}

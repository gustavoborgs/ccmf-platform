"use client";

import { useState, useTransition } from "react";
import { upsertReferralCampaignAction } from "@/modules/referrals/actions";
import type { ReferralCampaignFormInput } from "@/modules/referrals/validators";
import { Button, Field, SelectInput, TextInput } from "@/shared/ui";

type ContestOption = { id: string; year: number; name: string };

type AdminCampaignFormProps = {
  contests: ContestOption[];
  initial?: Partial<ReferralCampaignFormInput> & { contestId?: string };
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminCampaignForm({ contests, initial }: AdminCampaignFormProps) {
  const [form, setForm] = useState({
    contestId: initial?.contestId ?? contests[0]?.id ?? "",
    name: initial?.name ?? "Indique e ganhe curtidas",
    enabled: initial?.enabled ?? true,
    rewardLikesCount: initial?.rewardLikesCount ?? 50,
    startsAt: toDateTimeLocalValue(initial?.startsAt),
    endsAt: toDateTimeLocalValue(initial?.endsAt),
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await upsertReferralCampaignAction({
        ...form,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      });
      if (result.ok) {
        setSuccess("Campanha salva com sucesso.");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Edição">
        <SelectInput
          value={form.contestId}
          onChange={(event) => setForm({ ...form, contestId: event.target.value })}
        >
          {contests.map((contest) => (
            <option key={contest.id} value={contest.id}>
              {contest.year} — {contest.name}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Nome da campanha">
        <TextInput
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Curtidas de prêmio">
          <TextInput
            type="number"
            min={1}
            value={String(form.rewardLikesCount)}
            onChange={(event) =>
              setForm({ ...form, rewardLikesCount: Number(event.target.value) || 0 })
            }
          />
        </Field>
        <Field label="Status">
          <SelectInput
            value={form.enabled ? "enabled" : "disabled"}
            onChange={(event) =>
              setForm({ ...form, enabled: event.target.value === "enabled" })
            }
          >
            <option value="enabled">Ativa</option>
            <option value="disabled">Desligada</option>
          </SelectInput>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início (opcional)">
          <TextInput
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
          />
        </Field>
        <Field label="Fim (opcional)">
          <TextInput
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
          />
        </Field>
      </div>

      <Button onClick={submit} disabled={pending || !form.contestId}>
        {pending ? "Salvando..." : "Salvar campanha"}
      </Button>

      {error && <p className="text-sm font-semibold text-accent-700">{error}</p>}
      {success && <p className="text-sm font-semibold text-primary-700">{success}</p>}
    </div>
  );
}

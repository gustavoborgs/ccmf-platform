"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Field, SelectInput, TextInput } from "@/shared/ui/field";
import { createParticipantAction } from "../actions";

/** Step 2a — dados da criança; categoria resolvida pela idade no backend. */

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export function ParticipantStep({
  onDone,
}: {
  onDone: (data: {
    registrationId: string;
    protocol: string;
    categoryName: string;
    participantName: string;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    gender: "",
    city: "",
    state: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createParticipantAction({
        name: form.name,
        birthDate: form.birthDate,
        gender: form.gender || undefined,
        city: form.city,
        state: form.state,
        imageConsent: consent,
      });
      if (result.ok) onDone(result.data);
      else setError(result.error);
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
        {pending ? "Salvando..." : "Salvar e enviar fotos"}
      </Button>

      {error && <p className="text-sm font-semibold text-accent-700">{error}</p>}
    </div>
  );
}

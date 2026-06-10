"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Field, TextInput } from "@/shared/ui/field";
import {
  captureLeadAction,
  checkCpfAction,
  createGuardianAction,
  linkGuardianAction,
} from "../actions";
import { fetchAddressByCep, formatCep } from "./address-by-cep";

/**
 * Step 1 — Responsável (CPF-first).
 * CPF existente → vincula sem autenticar. CPF novo → cadastro + endereço via CEP.
 */

type CpfStatus = "idle" | "exists" | "new";

const emptyAddress = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function formatCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function GuardianStep({
  prefill,
  onDone,
}: {
  prefill?: { name?: string; emailMasked?: string; phoneMasked?: string };
  onDone: (ref: string) => void;
}) {
  const [cpf, setCpf] = useState("");
  const [cpfStatus, setCpfStatus] = useState<CpfStatus>("idle");
  const [form, setForm] = useState({
    name: prefill?.name ?? "",
    email: "",
    phone: "",
    password: "",
    ...emptyAddress,
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    setCepHint(null);
    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        setCepHint("CEP não encontrado. Verifique e tente novamente.");
        return;
      }
      setForm((current) => ({
        ...current,
        zipCode: address.zipCode,
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }));
      setCepHint(`${address.city} / ${address.state}`);
    } finally {
      setCepLoading(false);
    }
  }

  function checkCpf() {
    setError(null);
    startTransition(async () => {
      const result = await checkCpfAction(cpf);
      if (!result.ok) return setError(result.error);
      setCpfStatus(result.data.exists ? "exists" : "new");
      if (!result.data.exists) void captureLeadAction({ cpf, name: form.name });
    });
  }

  function linkExisting() {
    setError(null);
    startTransition(async () => {
      const result = await linkGuardianAction(cpf);
      if (result.ok) onDone(result.data.ref);
      else setError(result.error);
    });
  }

  function createAccount() {
    setError(null);
    startTransition(async () => {
      const result = await createGuardianAction({ cpf, ...form });
      if (result.ok) onDone(result.data.ref);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <Field label="CPF do responsável" hint="Usamos o CPF para localizar ou criar seu cadastro.">
        <TextInput
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(event) => {
            setCpf(formatCpf(event.target.value));
            setCpfStatus("idle");
          }}
          disabled={pending}
        />
      </Field>

      {cpfStatus === "idle" && (
        <Button onClick={checkCpf} disabled={pending || cpf.replace(/\D/g, "").length !== 11}>
          {pending ? "Verificando..." : "Continuar"}
        </Button>
      )}

      {cpfStatus === "exists" && (
        <div className="rounded-2xl bg-primary-50 p-4">
          <p className="font-semibold text-primary-800">
            Encontramos seu cadastro! Vamos continuar a inscrição vinculada a ele.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Você poderá acessar sua conta depois, com sua senha ou recuperação de acesso.
          </p>
          <Button className="mt-4" onClick={linkExisting} disabled={pending}>
            {pending ? "Vinculando..." : "Continuar inscrição"}
          </Button>
        </div>
      )}

      {cpfStatus === "new" && (
        <div className="space-y-4">
          <Field label="Nome completo">
            <TextInput
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              onBlur={() => void captureLeadAction({ cpf, name: form.name })}
              autoComplete="name"
            />
          </Field>
          <Field label="E-mail" hint={prefill?.emailMasked && `Você usou ${prefill.emailMasked}`}>
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              onBlur={() => void captureLeadAction({ cpf, name: form.name, email: form.email })}
              autoComplete="email"
            />
          </Field>
          <Field label="Telefone (WhatsApp)" hint={prefill?.phoneMasked && `Você usou ${prefill.phoneMasked}`}>
            <TextInput
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              onBlur={() =>
                void captureLeadAction({ cpf, name: form.name, email: form.email, phone: form.phone })
              }
              autoComplete="tel"
            />
          </Field>

          <div className="border-t border-primary-100 pt-4">
            <p className="mb-3 font-display text-sm font-bold text-primary-700">Endereço</p>

            <Field
              label="CEP"
              hint={cepLoading ? "Buscando endereço..." : cepHint ?? "Preencha o CEP para localizar rua, bairro e cidade."}
            >
              <TextInput
                inputMode="numeric"
                placeholder="00000-000"
                value={formatCep(form.zipCode)}
                onChange={(event) => {
                  const zipCode = event.target.value.replace(/\D/g, "").slice(0, 8);
                  setForm({ ...form, zipCode });
                  setCepHint(null);
                }}
                onBlur={(event) => void lookupCep(event.target.value)}
                autoComplete="postal-code"
              />
            </Field>

            <div className="mt-4 space-y-4">
              <Field label="Rua / Avenida">
                <TextInput
                  value={form.street}
                  onChange={(event) => setForm({ ...form, street: event.target.value })}
                  autoComplete="address-line1"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Número">
                  <TextInput
                    value={form.number}
                    onChange={(event) => setForm({ ...form, number: event.target.value })}
                    autoComplete="off"
                  />
                </Field>
                <Field label="Complemento" hint="Opcional">
                  <TextInput
                    value={form.complement}
                    onChange={(event) => setForm({ ...form, complement: event.target.value })}
                    autoComplete="off"
                  />
                </Field>
              </div>

              <Field label="Bairro">
                <TextInput
                  value={form.neighborhood}
                  onChange={(event) => setForm({ ...form, neighborhood: event.target.value })}
                  autoComplete="off"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-[1fr_5rem]">
                <Field label="Cidade">
                  <TextInput
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="UF">
                  <TextInput
                    value={form.state}
                    onChange={(event) =>
                      setForm({ ...form, state: event.target.value.toUpperCase().slice(0, 2) })
                    }
                    autoComplete="address-level1"
                  />
                </Field>
              </div>
            </div>
          </div>

          <Field label="Crie uma senha" hint="Mínimo de 8 caracteres — para acompanhar a inscrição depois.">
            <TextInput
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="new-password"
            />
          </Field>

          <Button onClick={createAccount} disabled={pending || cepLoading}>
            {pending ? "Criando cadastro..." : "Criar cadastro e continuar"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-accent-700">{error}</p>}
    </div>
  );
}

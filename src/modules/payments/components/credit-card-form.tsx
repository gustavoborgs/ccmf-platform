"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Field, TextInput } from "@/shared/ui/field";
import type { CreditCardInput } from "../validators";

/** Formulário de cartão — os dados vão direto para a action (nunca persistidos). */

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function CreditCardForm({
  amountFormatted,
  submitting,
  onSubmit,
}: {
  amountFormatted: string;
  submitting: boolean;
  onSubmit: (card: CreditCardInput) => void;
}) {
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");

  const [month = "", year = ""] = expiry.split("/");
  const canSubmit =
    holderName.trim().length >= 3 &&
    number.replace(/\D/g, "").length >= 13 &&
    month.length === 2 &&
    year.length >= 2 &&
    ccv.length >= 3;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          holderName: holderName.trim(),
          number: number.replace(/\D/g, ""),
          expiryMonth: month,
          expiryYear: year,
          ccv,
        });
      }}
    >
      <Field label="Nome impresso no cartão">
        <TextInput
          value={holderName}
          onChange={(event) => setHolderName(event.target.value)}
          autoComplete="cc-name"
          placeholder="Como aparece no cartão"
          required
        />
      </Field>

      <Field label="Número do cartão">
        <TextInput
          value={number}
          onChange={(event) => setNumber(formatCardNumber(event.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Validade" hint="MM/AA">
          <TextInput
            value={expiry}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
              setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
            }}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            required
          />
        </Field>
        <Field label="CVV">
          <TextInput
            value={ccv}
            onChange={(event) => setCcv(event.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            required
          />
        </Field>
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
        {submitting ? "Processando pagamento..." : `Pagar ${amountFormatted}`}
      </Button>

      <p className="text-center text-xs text-ink-muted">
        Pagamento processado com segurança pelo Asaas. Não armazenamos os dados do seu cartão.
      </p>
    </form>
  );
}

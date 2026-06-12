"use client";

import { useState, useTransition, type FormEvent } from "react";
import { trackEvent } from "@/shared/analytics/events";
import { Button, Field, TextInput } from "@/shared/ui";
import { createContactMessageAction } from "../actions";

const textareaClasses =
  "w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 text-ink " +
  "placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none " +
  "focus:ring-2 focus:ring-accent-200 disabled:opacity-60";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createContactMessageAction({ name, email, phone, message });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setSuccess(true);
      trackEvent("generate_lead", { method: "contact_form" });
      trackEvent("contact_form_submit", { has_phone: Boolean(phone) });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome">
          <TextInput
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            placeholder="Seu nome completo"
            autoComplete="name"
          />
        </Field>

        <Field label="E-mail">
          <TextInput
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        </Field>
      </div>

      <Field label="Telefone / WhatsApp" hint="Opcional — facilita o retorno da equipe.">
        <TextInput
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={isPending}
          placeholder="(11) 99999-9999"
          autoComplete="tel"
        />
      </Field>

      <Field label="Mensagem">
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isPending}
          placeholder="Escreva sua dúvida sobre inscrição, fotos, pagamento ou regulamento."
          className={textareaClasses}
        />
      </Field>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Mensagem enviada com sucesso! A equipe vai responder pelo e-mail informado.
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}

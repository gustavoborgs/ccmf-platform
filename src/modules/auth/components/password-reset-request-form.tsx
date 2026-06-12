"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { PasswordResetRequestState } from "../actions";
import { requestPasswordResetAction } from "../actions";
import { Button, Field, TextInput } from "@/shared/ui";

const initialState: PasswordResetRequestState = {};

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4 text-sm text-ink">
          <p className="font-bold text-primary-800">Confira seu e-mail</p>
          <p className="mt-1 text-ink-muted">
            Se encontrarmos um cadastro com os dados informados, enviaremos um link para
            você definir uma nova senha.
          </p>
        </div>

        <Button href="/entrar" variant="outline" className="w-full">
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Field label="CPF ou e-mail do responsável" hint="Use o CPF do responsável ou o e-mail cadastrado.">
        <TextInput
          name="identifier"
          type="text"
          autoComplete="username"
          inputMode="email"
          placeholder="000.000.000-00 ou voce@email.com"
          required
        />
      </Field>

      {state.error && (
        <p className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Lembrou sua senha?{" "}
        <Link href="/entrar" className="font-bold text-accent-700 hover:underline">
          Entrar na conta
        </Link>
        .
      </p>
    </form>
  );
}

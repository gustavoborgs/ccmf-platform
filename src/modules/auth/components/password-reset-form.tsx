"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { PasswordResetState } from "../actions";
import { resetPasswordAction } from "../actions";
import { Button, Field, TextInput } from "@/shared/ui";

const initialState: PasswordResetState = {};

export function PasswordResetForm({
  token,
  callbackUrl = "/conta",
}: {
  token: string;
  callbackUrl?: string;
}) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field label="Nova senha">
        <TextInput
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          minLength={8}
          required
        />
      </Field>

      <Field label="Confirme a nova senha">
        <TextInput
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Digite novamente"
          minLength={8}
          required
        />
      </Field>

      {state.error && (
        <p className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Definindo senha..." : "Definir senha e entrar"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        O link expirou?{" "}
        <Link href="/recuperar-senha" className="font-bold text-accent-700 hover:underline">
          Solicite um novo
        </Link>
        .
      </p>
    </form>
  );
}

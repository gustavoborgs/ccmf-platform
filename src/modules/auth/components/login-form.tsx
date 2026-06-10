"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { FormEvent, useState, useTransition } from "react";
import { loginSchema } from "../validators";
import { Button, Field, TextInput } from "@/shared/ui";

/**
 * Formulário de entrada do responsável.
 * O cadastro público continua acontecendo no wizard de inscrição.
 */

export function LoginForm({ callbackUrl = "/conta" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: formData.get("callbackUrl"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      const session = await getSession();
      const defaultDestination =
        session?.user.role === "ADMIN"
          ? "/admin"
          : session?.user.role === "JUDGE"
            ? "/jurados"
            : "/conta";
      const destination =
        parsed.data.callbackUrl === "/conta" ? defaultDestination : parsed.data.callbackUrl;

      router.push(destination);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field label="E-mail">
        <TextInput
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          required
        />
      </Field>

      <Field label="Senha">
        <TextInput
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          required
        />
      </Field>

      {error && (
        <p className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Ainda não tem inscrição?{" "}
        <Link href="/inscricao" className="font-bold text-accent-700 hover:underline">
          Comece pelo cadastro da criança
        </Link>
        .
      </p>
    </form>
  );
}

"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "./config";
import { requestPasswordReset, resetPasswordWithToken } from "./service";
import { loginSchema, passwordResetRequestSchema, passwordResetSchema } from "./validators";

/**
 * Server Actions do módulo de autenticação.
 * Spec: docs/modules/auth.md
 */

export type LoginState = {
  error?: string;
};

export type PasswordResetRequestState = {
  error?: string;
  sent?: boolean;
};

export type PasswordResetState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/entrar" });
}

export async function requestPasswordResetAction(
  _state: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const parsed = passwordResetRequestSchema.safeParse({
    identifier: formData.get("identifier"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await requestPasswordReset(parsed.data.identifier);
  } catch (error) {
    console.error("[auth] password reset email failed", error);
  }

  return { sent: true };
}

export async function resetPasswordAction(
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    callbackUrl: formData.get("callbackUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let email: string;
  try {
    const result = await resetPasswordWithToken({
      token: parsed.data.token,
      password: parsed.data.password,
    });
    email = result.email;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível redefinir a senha." };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Senha definida, mas não foi possível entrar automaticamente." };
    }
    throw error;
  }

  return {};
}

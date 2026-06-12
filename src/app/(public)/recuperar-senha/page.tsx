import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/config";
import { PasswordResetRequestForm } from "@/modules/auth/components/password-reset-request-form";
import { Card, Container } from "@/shared/ui";

export default async function PasswordResetRequestPage() {
  const session = await auth();

  if (session?.user?.role === "GUARDIAN") redirect("/conta");
  if (session?.user?.role === "ADMIN") redirect("/admin");
  if (session?.user?.role === "JUDGE") redirect("/jurados");

  return (
    <Container className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Recuperar acesso
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">
            Esqueci minha senha
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Informe seu CPF ou e-mail cadastrado. Se encontrarmos sua conta, enviaremos
            um link para você criar uma nova senha.
          </p>
        </div>

        <PasswordResetRequestForm />
      </Card>
    </Container>
  );
}

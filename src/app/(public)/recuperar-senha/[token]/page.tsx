import { getPasswordResetTokenStatus } from "@/modules/auth/service";
import { PasswordResetForm } from "@/modules/auth/components/password-reset-form";
import { Button, Card, Container } from "@/shared/ui";

export default async function PasswordResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ token }, { callbackUrl }] = await Promise.all([params, searchParams]);
  const safeCallbackUrl =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/conta";
  const status = await getPasswordResetTokenStatus(token);

  return (
    <Container className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Nova senha
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">
            Defina sua nova senha
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Crie uma senha de pelo menos 8 caracteres. Depois disso, você já entra
            automaticamente na sua conta.
          </p>
        </div>

        {status === "valid" ? (
          <PasswordResetForm token={token} callbackUrl={safeCallbackUrl} />
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-4 text-sm text-accent-900">
              <p className="font-bold">Link inválido ou expirado</p>
              <p className="mt-1">
                Solicite um novo link de recuperação para definir sua senha.
              </p>
            </div>

            <Button href="/recuperar-senha" className="w-full">
              Solicitar novo link
            </Button>
          </div>
        )}
      </Card>
    </Container>
  );
}

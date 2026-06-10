import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/config";
import { LoginForm } from "@/modules/auth/components/login-form";
import { Card, Container } from "@/shared/ui";

/**
 * Página pública de login. O cadastro de responsáveis acontece no wizard
 * de inscrição; aqui o responsável acessa a conta já criada.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, session] = await Promise.all([searchParams, auth()]);
  const safeCallbackUrl =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/conta";

  if (session?.user.role === "GUARDIAN") redirect(safeCallbackUrl);
  if (session?.user.role === "ADMIN") redirect("/admin");

  return (
    <Container className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Área do responsável
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Entrar na minha conta</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Acompanhe suas inscrições, status de pagamento e próximas etapas do concurso.
          </p>
        </div>

        <LoginForm callbackUrl={safeCallbackUrl} />
      </Card>
    </Container>
  );
}

import { Button, Container } from "@/shared/ui";

/** Destino do link de retomada quando a inscrição já está paga. */
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;

  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-extrabold">
        <span className="text-brand-gradient">Inscrição confirmada!</span>
      </h1>
      {protocolo && (
        <p className="mt-4 text-ink-muted">
          Protocolo <span className="font-mono font-bold text-primary-800">{protocolo}</span>
        </p>
      )}
      <p className="mt-2 text-ink-muted">
        O pagamento foi confirmado. Acompanhe o status da avaliação na sua conta.
      </p>
      <Button href="/entrar" className="mt-8">
        Acessar minha conta
      </Button>
    </Container>
  );
}

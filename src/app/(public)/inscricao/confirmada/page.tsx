import { GraduationCap } from "lucide-react";
import { Button, Container } from "@/shared/ui";
import { InscricaoConfirmadaTracker } from "./inscricao-confirmada-tracker";

/** Destino do link de retomada quando a inscrição já está paga. */
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;

  return (
    <Container className="py-24 text-center">
      {protocolo && <InscricaoConfirmadaTracker protocol={protocolo} />}
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

      {/* Entrega imediata do bônus — aumenta valor percebido pós-compra */}
      <div className="mx-auto mt-10 max-w-xl rounded-bubble border border-accent-200 bg-gradient-to-br from-primary-700 to-primary-600 p-8 text-white shadow-brand">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <GraduationCap aria-hidden className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-extrabold">
          Seu bônus de R$ 350 já está liberado
        </h2>
        <p className="mt-2 text-sm text-white/85">
          O curso <strong>Como Gerenciar a Carreira do Seu Filho</strong>, de Claudia
          Cavalcante, está disponível na sua conta. Comece hoje pelo capítulo 1: a carta da
          Claudia leva menos de 10 minutos.
        </p>
        <Button
          href="/conta/formacao"
          variant="secondary"
          className="mt-5 bg-white text-accent-700 hover:bg-accent-50"
        >
          Começar o curso agora
        </Button>
      </div>

      <div className="mt-8">
        <Button href="/entrar" variant="outline">
          Acessar minha conta
        </Button>
      </div>
    </Container>
  );
}

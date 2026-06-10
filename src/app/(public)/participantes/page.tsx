import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listPublicYears } from "@/modules/participants/service";
import { Button, Card, Container } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Participantes",
  description:
    "Conheça os participantes do Concurso Criança Mais Fotogênica, curta as fotos e compartilhe com a família.",
};

export const dynamic = "force-dynamic";

/** Índice: leva direto para a galeria da edição mais recente com aprovados. */
export default async function ParticipantsIndexPage() {
  const years = await listPublicYears();
  if (years.length > 0) {
    redirect(`/participantes/${years[0]}`);
  }

  return (
    <section className="py-20">
      <Container>
        <Card className="mx-auto max-w-2xl py-12 text-center">
          <h1 className="font-display text-3xl font-extrabold text-primary-700">
            A galeria ainda não foi aberta
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-muted">
            Assim que as primeiras inscrições forem aprovadas, os participantes
            aparecem aqui para você curtir e compartilhar.
          </p>
          <Button href="/inscricao" size="lg" className="mt-8">
            Inscrever minha criança
          </Button>
        </Card>
      </Container>
    </section>
  );
}

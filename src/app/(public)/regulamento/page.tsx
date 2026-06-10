import type { Metadata } from "next";
import { MarkdownDocument } from "@/modules/contests/components/markdown-document";
import { getActiveContest } from "@/modules/contests/service";
import { Button, Card, Container } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Regulamento",
  description:
    "Leia o regulamento completo do Concurso Criança Mais Fotogênica Brasil, com regras de participação, inscrição, seleção, premiação e programação.",
};

export default async function RegulationPage() {
  const contest = await getActiveContest();
  const regulationMarkdown = contest?.regulationMd?.trim();

  return (
    <>
      <section className="bg-brand-gradient text-white">
        <Container className="py-20 lg:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
            Regras da edição
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Regulamento do Concurso Criança Mais Fotogênica Brasil
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Consulte as condições de participação, critérios de seleção, uso de
            imagem, política de dados, premiações e programação da edição.
          </p>
          {contest && (
            <p className="mt-3 font-display text-lg font-bold text-white/85">
              {contest.name} · {contest.year}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/inscricao" size="lg" variant="secondary" className="bg-white text-accent-700 hover:bg-accent-50">
              Quero participar
            </Button>
            <Button href="/o-concurso" size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Conhecer o concurso
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20">
        <Container className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="p-6 sm:p-10">
            {regulationMarkdown ? (
              <MarkdownDocument content={regulationMarkdown} skipFirstHeading />
            ) : (
              <div className="py-8">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
                  Regulamento indisponível
                </p>
                <h2 className="mt-3 text-3xl font-extrabold text-primary-700">
                  Nenhum regulamento publicado no momento
                </h2>
                <p className="mt-4 max-w-2xl text-ink-muted">
                  O regulamento será exibido aqui assim que houver uma edição
                  com inscrições abertas e texto cadastrado pela organização.
                </p>
              </div>
            )}
          </Card>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card>
              <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
                Importante
              </p>
              <h2 className="mt-3 text-2xl font-extrabold text-primary-700">
                Leia antes de se inscrever
              </h2>
              <p className="mt-3 text-sm/6 text-ink-muted">
                A inscrição confirma a aceitação de todos os itens do
                regulamento. O pagamento da taxa é necessário para validar a
                participação.
              </p>
            </Card>
          </aside>
        </Container>
      </section>
    </>
  );
}

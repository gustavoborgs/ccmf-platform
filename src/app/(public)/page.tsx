import Image from "next/image";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

/**
 * Home pública. Hero aplicando o design system (docs/05-design-system.md);
 * demais seções (prêmios, vencedores, blog, parceiros) virão de
 * docs/modules/content.md quando os módulos forem ligados.
 */
export default function HomePage() {
  return (
    <>
      {/* Hero — gradiente oficial da marca */}
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              Inscrições abertas — edição 2026
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              O maior concurso de fotografia infantil do Brasil
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Avaliação técnica por jurados especializados, prêmios incríveis e
              destaque nacional para a sua criança.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/inscricao" size="lg" variant="secondary" className="bg-white text-accent-700 hover:bg-accent-50">
                Quero participar
              </Button>
              <Button href="/o-concurso" size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Conhecer o concurso
              </Button>
            </div>
          </div>

          <div className="mx-auto hidden lg:block">
            <Image
              src="/brand/logo-full.png"
              alt="Concurso Criança Mais Fotogênica"
              width={420}
              height={380}
              priority
              className="drop-shadow-2xl"
            />
          </div>
        </Container>
      </section>

      {/* Categorias — amostra da linguagem de cards bubble */}
      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Categorias"
            title="Uma categoria para cada fase da infância"
            description="A categoria é definida automaticamente pela idade da criança na inscrição."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Bebê", range: "até 10 meses" },
              { name: "Mirim", range: "11 a 23 meses" },
              { name: "Infantil", range: "2 a 5 anos" },
              { name: "Juvenil", range: "6 a 9 anos" },
              { name: "Teen", range: "10 a 14 anos" },
            ].map((category) => (
              <Card key={category.name} className="text-center">
                <h3 className="font-display text-xl font-extrabold text-primary-700">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{category.range}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button href="/inscricao" size="lg">
              Inscrever minha criança
            </Button>
          </div>
        </Container>
      </section>

      {/* TODO: prêmios, vencedores da edição anterior, blog e parceiros
          (dados via módulo content — docs/modules/content.md) */}
    </>
  );
}

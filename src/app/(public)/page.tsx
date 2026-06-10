import Image from "next/image";
import { Camera, Heart, Trophy } from "lucide-react";
import { PartnersShowcase } from "@/modules/content/components/partners-showcase";
import { listPartnersByType } from "@/modules/content/service";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

export const dynamic = "force-dynamic";

const highlights = [
  {
    icon: Camera,
    title: "Avaliação técnica",
    description: "Fotos avaliadas por critérios claros de fotogenia, expressão e enquadramento.",
  },
  {
    icon: Trophy,
    title: "Prêmios e destaque",
    description: "Os destaques de cada categoria ganham prêmios e uma vitrine nacional.",
  },
  {
    icon: Heart,
    title: "Pensado para famílias",
    description: "Inscrição simples, comunicação direta e cuidado com os dados das crianças.",
  },
];

/**
 * Home pública. Hero aplicando o design system (docs/05-design-system.md);
 * vitrines de parceiros vêm do módulo content (docs/modules/content.md).
 */
export default async function HomePage() {
  const partners = await listPartnersByType();

  return (
    <>
      {/* Hero — gradiente oficial da marca */}
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
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

          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <Image
              src="/people/children-hero.png"
              alt="Crianças sorrindo em ensaio fotográfico do concurso"
              width={640}
              height={427}
              priority
              className="rounded-bubble border-4 border-white/30 object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-6 -left-6 rounded-3xl bg-white px-5 py-4 shadow-brand-lg">
              <p className="font-display text-2xl font-extrabold text-brand-gradient">
                5 categorias
              </p>
              <p className="text-sm font-semibold text-ink-muted">do bebê ao teen</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Diferenciais */}
      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Por que o CCMF"
            title="Uma experiência profissional do início ao fim"
            description="Tudo acontece pela plataforma: inscrição, envio das fotos, pagamento e acompanhamento das etapas."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <Card key={highlight.title} className="text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                    <Icon aria-hidden="true" className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-extrabold text-primary-700">
                    {highlight.title}
                  </h3>
                  <p className="mt-2 text-sm/6 text-ink-muted">{highlight.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Categorias — amostra da linguagem de cards bubble */}
      <section className="bg-surface-muted py-20">
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

      {/* Parceiros — três vitrines (docs/modules/content.md) */}
      {partners.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading
              kicker="Quem apoia"
              title="Parceiros que acreditam na infância"
              description="Marcas, veículos de comunicação e patrocinadores que constroem cada edição com a gente."
            />
            <div className="mt-12">
              <PartnersShowcase partners={partners} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

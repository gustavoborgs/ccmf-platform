import type { Metadata } from "next";
import Image from "next/image";
import { Camera, Heart, ShieldCheck } from "lucide-react";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

export const metadata: Metadata = {
  title: "O Concurso",
  description:
    "Conheça o Concurso Criança Mais Fotogênica: como funciona a inscrição, a avaliação técnica e as categorias por faixa etária.",
};

const processSteps = [
  {
    title: "Inscrição online",
    description:
      "O responsável preenche os dados, informa a data de nascimento da criança e envia as fotos no formato solicitado.",
  },
  {
    title: "Categoria automática",
    description:
      "A plataforma identifica a categoria pela idade da criança na data da inscrição, seguindo as faixas da edição vigente.",
  },
  {
    title: "Avaliação técnica",
    description:
      "As fotos são avaliadas por critérios de fotogenia, expressão, enquadramento e presença diante da câmera.",
  },
  {
    title: "Divulgação dos destaques",
    description:
      "Participantes aprovados entram na etapa pública da edição e os resultados são divulgados pelos canais oficiais.",
  },
];

const judgingCriteria = [
  "Expressão natural e carisma",
  "Qualidade e nitidez da fotografia",
  "Enquadramento e composição visual",
  "Adequação às regras da edição",
];

const benefits = [
  "A faixa oficial e o título de Criança Mais Fotogênica, uma conquista nacional para guardar na história da família.",
  "Destaque nacional em uma vitrine dedicada à fotografia infantil.",
  "Categorias por faixa etária para uma disputa mais justa em cada fase da infância.",
  "Experiência organizada, acompanhada e segura para responsáveis e participantes.",
];

const categories = [
  { name: "Bebê", range: "até 10 meses" },
  { name: "Mirim", range: "11 a 23 meses" },
  { name: "Infantil", range: "2 a 5 anos" },
  { name: "Juvenil", range: "6 a 9 anos" },
  { name: "Teen", range: "10 a 14 anos" },
];

export default function AboutContestPage() {
  return (
    <>
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              O Concurso
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Uma vitrine nacional para a fotografia infantil
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              O Concurso Criança Mais Fotogênica valoriza expressão, carisma e
              presença diante da câmera em uma experiência lúdica, organizada e
              pensada para famílias de todo o Brasil.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/inscricao" size="lg" variant="secondary" className="bg-white text-accent-700 hover:bg-accent-50">
                Quero participar
              </Button>
              <Button href="/regulamento" size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Ver regulamento
              </Button>
            </div>
          </div>

          <Card className="border-white/25 bg-white/95 text-ink shadow-brand-lg">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
              Por que existe
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary-700">
              Celebrar a infância com cuidado e transparência
            </h2>
            <p className="mt-4 text-ink-muted">
              A proposta é reunir fotos infantis em uma seleção com regras
              claras, categorias definidas e comunicação direta com os
              responsáveis.
            </p>
          </Card>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Como funciona"
            title="Da inscrição à divulgação"
            description="O fluxo foi pensado para ser simples para a família e consistente para a organização da edição."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <Card key={step.title} className="relative overflow-hidden">
                <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-primary-100">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="relative pr-12 font-display text-xl font-extrabold text-primary-700">
                  {step.title}
                </h3>
                <p className="relative mt-3 text-sm/6 text-ink-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              kicker="Avaliação"
              title="Critérios claros para destacar boas fotos"
              description="A avaliação observa o conjunto da imagem e segue as regras publicadas para a edição ativa."
            />
            <ul className="mt-8 grid gap-3">
              {judgingCriteria.map((criterion) => (
                <li key={criterion} className="rounded-full bg-white px-5 py-3 font-semibold text-primary-700 shadow-brand">
                  {criterion}
                </li>
              ))}
            </ul>
          </div>

          <Card className="bg-white">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
              Categorias
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary-700">
              Cada fase da infância tem seu espaço
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <div key={category.name} className="rounded-3xl border border-primary-100 bg-surface px-5 py-4">
                  <h3 className="font-display text-xl font-extrabold text-primary-700">
                    {category.name}
                  </h3>
                  <p className="text-sm text-ink-muted">{category.range}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <Image
              src="/people/live-revelacao-selfie.jpg"
              alt="Criança sorrindo com coroa e a faixa de vencedora do Concurso Criança Mais Fotogênica"
              width={560}
              height={373}
              className="rounded-bubble object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-3xl bg-brand-gradient px-5 py-4 text-white shadow-brand-lg">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-white/75">
                O grande prêmio
              </p>
              <p className="mt-1 text-sm font-semibold text-white/95">
                Quem vence recebe a faixa oficial e carrega o título de Criança
                Mais Fotogênica da edição.
              </p>
            </div>
          </div>

          <div>
            <SectionHeading
              align="left"
              kicker="Diferenciais"
              title="Por que participar"
              description="Mais do que um concurso: é a chance de conquistar a faixa, levar o título de Criança Mais Fotogênica e celebrar esse momento da infância."
            />
            <div className="mt-8 grid gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="rounded-bubble border border-primary-100 bg-white p-5 shadow-brand">
                  <p className="font-semibold text-ink">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-brand-gradient py-20 text-white">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              Live Revelação
            </p>
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
              O resultado é anunciado ao vivo, com as famílias
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Cada edição termina na Live Revelação: uma transmissão pública em
              que os destaques de cada categoria são anunciados ao vivo, com
              crianças e responsáveis acompanhando juntos esse momento.
            </p>
            <p className="mt-3 text-lg text-white/90">
              É a forma mais transparente de celebrar o resultado, e o encontro
              das crianças com a fundadora vira memória para toda a família.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <Image
              src="/people/fundadora-criancas-live.jpg"
              alt="Claudia Cavalcante e crianças participantes tirando uma selfie durante a Live Revelação"
              width={1024}
              height={683}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="rounded-bubble border-4 border-white/30 object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-6 left-1/2 w-[85%] -translate-x-1/2 rounded-3xl bg-white px-5 py-3 text-center shadow-brand-lg">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
                Resultado ao vivo
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-muted">
                Transmissão pública, aberta para todas as famílias
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="relative mx-auto w-full max-w-lg">
            <Image
              src="/people/organizadora.png"
              alt="Claudia Cavalcante com crianças participantes no palco da Live Revelação do Concurso Criança Mais Fotogênica"
              width={1024}
              height={605}
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="rounded-bubble object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-5 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-3xl bg-white px-5 py-3 text-center shadow-brand-lg">
              <p className="font-display text-lg font-extrabold text-brand-gradient">
                Claudia Cavalcante · Fundadora
              </p>
            </div>
          </div>

          <div>
            <SectionHeading
              align="left"
              kicker="Quem organiza"
              title="Conduzido pela fotógrafa Claudia Cavalcante"
              description="Fundadora do concurso, Claudia lidera uma equipe dedicada que acompanha as famílias da inscrição até a divulgação dos resultados."
            />

            <div className="mt-8 grid gap-4">
              <div className="flex gap-4 rounded-bubble bg-white p-5 shadow-brand">
                <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                  <Heart aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-primary-700">
                    Atendimento próximo
                  </h3>
                  <p className="mt-1 text-sm/6 text-ink-muted">
                    Claudia e sua equipe respondem responsáveis diretamente
                    pelos canais oficiais, do primeiro contato à premiação.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-bubble bg-white p-5 shadow-brand">
                <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                  <Camera aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-primary-700">
                    Olhar especializado
                  </h3>
                  <p className="mt-1 text-sm/6 text-ink-muted">
                    Experiência em fotografia infantil e avaliação técnica para
                    garantir uma seleção justa entre as categorias.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-bubble bg-white p-5 shadow-brand">
                <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-primary-700">
                    Transparência e segurança
                  </h3>
                  <p className="mt-1 text-sm/6 text-ink-muted">
                    Regulamento público, pagamento confirmado pela plataforma e
                    proteção dos dados de crianças e responsáveis.
                  </p>
                </div>
              </div>
            </div>

            <Button href="/contato" size="lg" className="mt-8">
              Falar com a organização
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="rounded-bubble bg-brand-gradient px-6 py-12 text-center text-white shadow-brand-lg sm:px-10">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-white/75">
              Inscrições abertas
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Pronto para inscrever sua criança na próxima etapa?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Separe duas fotos em formato retrato e acompanhe todas as etapas
              pela plataforma.
            </p>
            <Button href="/inscricao" size="lg" variant="secondary" className="mt-8 bg-white text-accent-700 hover:bg-accent-50">
              Começar inscrição
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

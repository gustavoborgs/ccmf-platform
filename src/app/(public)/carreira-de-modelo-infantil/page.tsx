import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Camera,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  JsonLd,
} from "@/shared/seo/json-ld";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Carreira de Modelo Infantil: Guia Completo para Mães e Pais",
  description:
    "Guia completo sobre carreira de modelo infantil no Brasil: como começar com segurança, evitar golpes, escolher fotos, entender agências e concursos — e como gerenciar a carreira do seu filho sem sacrificar a infância.",
  keywords: [
    "carreira de modelo infantil",
    "como colocar meu filho para ser modelo",
    "como gerenciar a carreira do meu filho",
    "modelo infantil",
    "agência de modelo infantil",
    "book fotográfico infantil",
    "concurso de fotogenia infantil",
    "modelo mirim",
  ],
  alternates: { canonical: "/carreira-de-modelo-infantil" },
  openGraph: {
    title: "Carreira de Modelo Infantil: Guia Completo para Famílias",
    description:
      "Como começar com segurança, evitar golpes e proteger a infância — com o olhar de quem organiza o Concurso Criança Mais Fotogênica há 19 edições.",
    type: "article",
    url: "/carreira-de-modelo-infantil",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Proteção primeiro",
    description:
      "Nenhuma oportunidade vale a infância. Critérios claros para filtrar propostas, contratos e agências.",
  },
  {
    icon: Camera,
    title: "Fotos honestas",
    description:
      "Boas fotos em casa ou em concurso sério já abrem portas. Book caro não é pré-requisito para começar.",
  },
  {
    icon: GraduationCap,
    title: "Pais no comando",
    description:
      "Você é o gestor da carreira. Método, números reais e rotina equilibrada fazem mais diferença que promessas.",
  },
];

const steps = [
  {
    title: "Observe o interesse real da criança",
    description:
      "Fotogenia e conforto diante da câmera importam, mas o desejo da criança importa mais. Sem pressão, sem roteiro forçado.",
  },
  {
    title: "Separe oportunidades sérias de golpes",
    description:
      "Desconfie de quem cobra adiantado por “garantia de trabalho”, promete fama rápida ou pressiona a assinar no impulso.",
  },
  {
    title: "Construa um material simples e honesto",
    description:
      "Duas fotos boas, bem iluminadas, já bastam para muitos processos iniciais — inclusive concursos de fotogenia com regras públicas.",
  },
  {
    title: "Estude o mercado antes de investir",
    description:
      "Cachês, comissões, custos por fase e direitos da criança precisam estar claros. Investimento sem critério vira frustração.",
  },
  {
    title: "Gerencie com método, não com impulso",
    description:
      "O curso Como Gerenciar a Carreira do Seu Filho, da fundadora Claudia Cavalcante, ensina o método POFIA para decidir com segurança.",
  },
];

const faqs = [
  {
    question: "Como colocar meu filho para ser modelo infantil?",
    answer:
      "Comece observando se a criança realmente gosta de fotos e se sente confortável. Em seguida, organize material simples (boas fotos), filtre propostas com cuidado e prefira caminhos transparentes — como concursos com regulamento público — antes de investir em agências ou books caros.",
  },
  {
    question: "Preciso de agência para começar a carreira de modelo infantil?",
    answer:
      "Não necessariamente. Muitas famílias começam com fotos caseiras e experiências organizadas (como um concurso sério) para entender se faz sentido. Agência entra quando há demanda real e contratos claros — nunca como primeira e única opção.",
  },
  {
    question: "Book fotográfico infantil é obrigatório?",
    answer:
      "Não. Um book bem feito pode ajudar em etapas avançadas, mas não é obrigatório para começar. Fotos naturais, bem iluminadas e honestas costumam ser suficientes no início.",
  },
  {
    question: "Como identificar golpe em agência de modelo infantil?",
    answer:
      "Sinais de alerta: cobrança alta antecipada por “garantia de trabalho”, promessa de fama rápida, pressão para decidir na hora, falta de contrato claro e resistência a explicar comissões e direitos da criança.",
  },
  {
    question: "Qual a idade mínima para modelo mirim no Brasil?",
    answer:
      "Depende do tipo de trabalho e da legislação local (autorizações e regras de trabalho infantil artístico). Em concursos de fotogenia como o CCMF, as categorias vão de bebê a teen (cerca de 2 meses a 14 anos), com regras públicas no regulamento.",
  },
  {
    question: "Como gerenciar a carreira de modelo do meu filho sem prejudicar a infância?",
    answer:
      "Coloque escola, sono e bem-estar no centro. Use critérios para aceitar ou recusar trabalhos, acompanhe o humor da criança e evite sobrecarga. O curso da Claudia Cavalcante detalha esse equilíbrio com o método POFIA.",
  },
];

const relatedLinks = [
  {
    href: "/curso",
    title: "Curso Como Gerenciar a Carreira do Seu Filho",
    description: "Método completo da Claudia Cavalcante — gratuito para inscritos no concurso.",
  },
  {
    href: "/blog",
    title: "Artigos do blog CCMF",
    description: "Guias práticos sobre fotos, agências, concursos e proteção da infância.",
  },
  {
    href: "/o-concurso",
    title: "Como funciona o concurso",
    description: "19 edições, categorias por idade e avaliação técnica transparente.",
  },
];

export default function ChildModelingCareerPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Carreira de modelo infantil", path: "/carreira-de-modelo-infantil" },
        ])}
      />
      <JsonLd data={buildFaqJsonLd(faqs)} />

      <section className="bg-brand-gradient text-white">
        <Container className="py-16 lg:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
            Guia para famílias
          </p>
          <h1 className="max-w-4xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Carreira de modelo infantil: como começar com segurança e proteger a infância
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-white/90">
            A carreira de modelo infantil no Brasil pode ser uma experiência positiva — desde que a
            família lidere com critério, transparência e respeito à rotina da criança. Este guia
            resume o que mães e pais mais perguntam: como começar, o que evitar, quando investir e
            como gerenciar sem promessas vazias de fama.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/inscricao" size="lg" variant="secondary" className="bg-white text-accent-700 hover:bg-accent-50">
              Inscrever no concurso
            </Button>
            <Button href="/curso" size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Conhecer o curso
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeading
            kicker="Princípios"
            title="Três pilares antes de qualquer investimento"
            description="Quem organiza o Concurso Criança Mais Fotogênica há 19 edições vê o mesmo padrão: famílias bem preparadas tomam melhores decisões."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title}>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-extrabold text-primary-700">
                    {pillar.title}
                  </h2>
                  <p className="mt-2 text-sm/6 text-ink-muted">{pillar.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-16">
        <Container>
          <SectionHeading
            kicker="Passo a passo"
            title="Como colocar meu filho para ser modelo — com pé no chão"
            description="Não existe fórmula mágica. Existe um caminho organizado, honesto e reversível se a criança não quiser continuar."
          />
          <ol className="mx-auto mt-10 max-w-3xl space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-bubble bg-white p-5 shadow-brand sm:p-6">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-700">
                  Passo {index + 1}
                </p>
                <h3 className="mt-2 font-display text-xl font-extrabold text-primary-700">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm/6 text-ink-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              align="left"
              kicker="Concurso × agência × book"
              title="Qual caminho faz sentido no início?"
              description="Cada opção tem hora certa. Misturar tudo no começo costuma gerar custo alto e expectativa irreal."
            />
            <ul className="mt-8 space-y-3">
              {[
                "Concurso sério: regras públicas, categorias por idade e experiência organizada — bom termômetro inicial.",
                "Fotos em casa: baratas, naturais e suficientes para muitos processos de fotogenia.",
                "Book profissional: útil depois, quando já existe demanda ou direção clara — não é porta de entrada obrigatória.",
                "Agência: só com contrato claro, comissões transparentes e sem pressão. Nunca “garanta” trabalho pagando adiantado.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm/6 text-ink">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="border-accent-200 bg-accent-50/40">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent-700 shadow-brand">
              <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-primary-700">
              O CCMF como experiência segura
            </h2>
            <p className="mt-3 text-sm/6 text-ink-muted">
              O Concurso Criança Mais Fotogênica do Brasil reúne famílias de todo o país há 19
              edições. Inscrição online, regulamento público, categorias de bebê a teen e o curso
              de gestão de carreira da Claudia Cavalcante de brinde para todos os inscritos.
            </p>
            <Button href="/inscricao" className="mt-6">
              Ver inscrição da edição atual
            </Button>
          </Card>
        </Container>
      </section>

      <section className="bg-brand-gradient py-16 text-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              Formação para responsáveis
            </p>
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
              Como gerenciar a carreira de modelo do seu filho
            </h2>
            <p className="mt-4 text-lg text-white/90">
              O curso da fundadora Claudia Cavalcante ensina mercado, cachês, contratos, golpes e
              proteção da infância — sem prometer fama. É gratuito para quem confirma inscrição no
              concurso.
            </p>
            <Button href="/curso" size="lg" variant="secondary" className="mt-8 bg-white text-accent-700 hover:bg-accent-50">
              Conhecer o curso completo
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: BookOpen, label: "Método POFIA" },
              { icon: ShieldCheck, label: "Blindagem contra golpes" },
              { icon: HeartHandshake, label: "Infância no centro" },
              { icon: GraduationCap, label: "Pais como gestores" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-bubble bg-white/10 px-5 py-4 backdrop-blur">
                  <Icon className="h-6 w-6 text-white" aria-hidden />
                  <p className="mt-3 font-display text-lg font-bold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeading
            kicker="FAQ"
            title="Perguntas que mães e pais mais fazem"
            description="Respostas diretas, na linguagem real das buscas — para Google e para motores generativos."
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question} className="bg-white">
                <h3 className="font-display text-lg font-extrabold text-primary-700">{faq.question}</h3>
                <p className="mt-2 text-sm/6 text-ink-muted">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-16">
        <Container>
          <SectionHeading
            kicker="Continue explorando"
            title="Conteúdos e próximos passos"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {relatedLinks.map((link) => (
              <Card key={link.href} className="flex flex-col">
                <h3 className="font-display text-xl font-extrabold text-primary-700">
                  <Link href={link.href} className="transition hover:text-accent-700">
                    {link.title}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-sm/6 text-ink-muted">{link.description}</p>
                <Button href={link.href} variant="outline" size="sm" className="mt-5 self-start">
                  Abrir
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="rounded-bubble bg-brand-gradient px-6 py-12 text-center text-white shadow-brand-lg sm:px-10">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Pronto para uma experiência oficial de fotogenia infantil?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Inscreva sua criança no CCMF, receba o curso de gestão de carreira e participe com
              regras claras — sem promessa de fama, com proteção da infância.
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

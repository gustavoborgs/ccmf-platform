import type { Metadata } from "next";
import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getActiveContest } from "@/modules/contests/service";
import { getModuleIndex, getTrainingMeta } from "@/modules/academy/service";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Curso Como Gerenciar a Carreira do Seu Filho | CCMF",
  description:
    "Curso completo de gestão de carreira infantil por Claudia Cavalcante: mercado, cachês, contratos, golpes e proteção da infância. Incluso na inscrição do Concurso Criança Mais Fotogênica.",
};

/** Dores que o curso resolve — seção de identificação. */
const pains = [
  "Recebeu uma proposta de agência e não sabe se é séria ou golpe?",
  "Não faz ideia de quanto vale um cachê ou quanto custa começar?",
  "Tem medo de investir errado e se frustrar com promessas vazias?",
  "Quer apoiar o sonho do seu filho sem sacrificar escola, sono e infância?",
];

/** Entregas concretas — percepção de valor tangível. */
const deliverables = [
  {
    icon: BookOpen,
    title: "Método POFIA",
    description:
      "O mapa mental do pai-gestor: Proteger, Organizar, Filtrar, Investir e Acompanhar cada decisão da carreira.",
  },
  {
    icon: Sparkles,
    title: "Números reais de mercado",
    description:
      "Faixas de cachê, comissões de agência, custos por fase da carreira e como montar seu orçamento sem sustos.",
  },
  {
    icon: ShieldCheck,
    title: "Blindagem contra golpes",
    description:
      "As bandeiras vermelhas de propostas que exploram famílias e as perguntas certas antes de assinar qualquer contrato.",
  },
  {
    icon: HeartHandshake,
    title: "Proteção da infância",
    description:
      "Sinais da criança, equilíbrio com escola e rotina, e quando acelerar, segurar ou parar. A família no centro.",
  },
];

const faqs = [
  {
    question: "Como recebo o acesso ao curso?",
    answer:
      "O acesso é liberado automaticamente na sua conta assim que o pagamento da inscrição é confirmado. Você não paga nada a mais: o curso é um brinde para todos os inscritos da edição atual.",
  },
  {
    question: "Preciso de algum conhecimento prévio?",
    answer:
      "Não. O curso foi escrito para mães e pais que estão começando do zero, com linguagem simples e exemplos reais. Cada capítulo termina com um exercício prático.",
  },
  {
    question: "O curso promete fama ou contrato para meu filho?",
    answer:
      "Não, e desconfie de quem prometer. O curso entrega método, critérios e proteção: ele prepara você para tomar boas decisões, não vende resultado garantido.",
  },
  {
    question: "Posso ler no celular?",
    answer:
      "Sim. O curso é 100% online, em formato de leitura diagramada, e funciona em qualquer dispositivo. Você estuda no seu ritmo e pode voltar aos capítulos quando quiser.",
  },
];

/**
 * Landing pública do curso premium. Narrativa: curso escrito pela fundadora, vendido por
 * R$ 350, gratuito para inscritos confirmados nesta edição.
 * CTA único: /inscricao. Plano: docs/academy-plano-conversao.md
 */
export default async function CoursePage() {
  const contest = await getActiveContest();
  const meta = getTrainingMeta();
  const modules = getModuleIndex();

  const registrationsOpen = Boolean(contest);
  const feeLabel = contest ? formatCentsBRL(contest.registrationFeeCents) : null;
  const readingHours = Math.max(1, Math.round(meta.totalReadingMinutes / 60));

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-display text-sm font-bold uppercase tracking-widest">
              <GraduationCap aria-hidden className="h-4 w-4" />
              Grátis para inscritos confirmados
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
              {meta.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              O curso completo de gestão de carreira infantil, escrito pela fundadora{" "}
              <strong className="font-semibold">{meta.author}</strong>, é vendido por{" "}
              <strong className="font-semibold">R$ 350</strong>. Nesta edição do Concurso
              Criança Mais Fotogênica, ele fica gratuito para todos os inscritos confirmados.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {registrationsOpen ? (
                <Button
                  href="/inscricao"
                  size="lg"
                  variant="secondary"
                  className="bg-white text-accent-700 hover:bg-accent-50"
                >
                  Inscrever por {feeLabel} e destravar
                </Button>
              ) : (
                <Button
                  href="/contato"
                  size="lg"
                  variant="secondary"
                  className="bg-white text-accent-700 hover:bg-accent-50"
                >
                  Avise-me da próxima edição
                </Button>
              )}
              <Button
                href="#conteudo"
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Ver o conteúdo
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/80">
              {meta.totalChapters} capítulos · mais de {readingHours} horas de conteúdo ·
              leitura no celular, no seu ritmo
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <Image
              src="/academy/promo-phone.jpg"
              alt="Celular exibindo o curso Como Gerenciar a Carreira do Seu Filho"
              width={1536}
              height={1024}
              priority
              quality={80}
              sizes="(min-width: 768px) 28rem, 100vw"
              className="rounded-bubble border-4 border-white/30 object-cover shadow-brand-lg"
            />
          </div>
        </Container>
      </section>

      {/* Identificação — as dores */}
      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Para quem é este curso"
            title="Seu filho tem potencial. E agora?"
            description="Entre o elogio da família e a primeira proposta de verdade existe um mundo que ninguém explica para os pais. É exatamente esse mundo que o curso abre para você."
          />
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {pains.map((pain) => (
              <Card key={pain} className="flex items-start gap-3">
                <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                <p className="text-sm/6 text-ink-muted">{pain}</p>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-ink-muted">
            Se você se reconheceu em alguma dessas perguntas, este curso foi escrito para a
            sua família.
          </p>
        </Container>
      </section>

      {/* Autoridade — Claudia */}
      <section className="bg-surface-muted py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <Image
              src="/academy/cover-training.png"
              alt="Ilustração de mãe e filha, capa do curso"
              width={614}
              height={818}
              quality={75}
              sizes="(min-width: 1024px) 24rem, 100vw"
              className="rounded-bubble object-cover shadow-brand-lg"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              kicker="Quem assina o curso"
              title="Quase vinte anos ao lado de famílias como a sua"
              description={meta.authorRole}
            />
            <div className="mt-6 space-y-4 text-ink-muted">
              <p>
                Claudia Cavalcante acompanhou de perto centenas de famílias que chegaram ao
                concurso com o mesmo misto de esperança e medo de errar. Viu quem investiu
                com método e cresceu com segurança, e viu quem se perdeu em promessas caras.
              </p>
              <p>
                Este curso reúne tudo o que ela aprendeu nesse caminho: o que funciona, o
                que é golpe, quanto custa de verdade e como proteger a infância enquanto o
                talento se desenvolve.
              </p>
              <blockquote className="border-l-4 border-accent-400 pl-4 font-display text-lg font-bold text-primary-700">
                &ldquo;Talento chama atenção, gestão com amor e critério constrói trajetória.&rdquo;
              </blockquote>
            </div>
          </div>
        </Container>
      </section>

      {/* O que você vai dominar */}
      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="O que você leva"
            title="Ferramentas práticas, não teoria vazia"
            description="Cada módulo termina com exercícios, checklists e modelos prontos para aplicar na mesma semana."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {deliverables.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title}>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                    <Icon aria-hidden className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-primary-700">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm/6 text-ink-muted">{item.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Conteúdo — módulos */}
      <section id="conteudo" className="scroll-mt-24 bg-surface-muted py-20">
        <Container>
          <SectionHeading
            kicker="Conteúdo completo"
            title={`${meta.totalChapters} capítulos em 6 módulos`}
            description="Da mentalidade do pai-gestor ao plano de ação de 90 dias, com valores reais de mercado no meio do caminho."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.slug} className="overflow-hidden p-0">
                <div className="relative aspect-[3/2]">
                  <Image
                    src={module.cover}
                    alt={`Capa do módulo ${module.title}`}
                    fill
                    quality={70}
                    sizes="(min-width: 1024px) 24rem, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="font-display text-xs font-extrabold uppercase tracking-widest text-accent-700">
                    Módulo {module.order} · {module.chapters.length} capítulos
                  </p>
                  <h3 className="mt-1 font-display text-lg font-extrabold text-primary-700">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm/6 text-ink-muted">{module.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Oferta — âncora de valor */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-bubble border border-accent-200 bg-gradient-to-br from-primary-700 to-primary-600 p-8 text-center text-white shadow-brand-lg sm:p-12">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-widest">
              <Lock aria-hidden className="h-3.5 w-3.5" />
              Como ter acesso
            </p>
            <h2 className="mt-6 text-balance font-display text-3xl font-extrabold sm:text-4xl">
              Para os inscritos do concurso, é grátis
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Curso escrito pela fundadora Claudia Cavalcante, vendido por R$ 350. Nesta
              edição, ele é o brinde oficial da inscrição: gratuito para todos os inscritos
              confirmados. Você inscreve sua criança, garante o Pacote Participante Oficial e
              recebe o curso completo assim que o pagamento é confirmado.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-bubble bg-white/10 p-6">
              <p className="text-sm text-white/70 line-through">Valor do curso R$ 350,00</p>
              {registrationsOpen ? (
                <>
                  <p className="mt-1 font-display text-2xl font-extrabold">
                    Grátis para inscritos confirmados
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Junto com a foto profissional por IA, página pública, certificado e a
                    disputa pela faixa nacional.
                  </p>
                </>
              ) : (
                <p className="mt-1 font-display text-xl font-extrabold">
                  Inscrições da próxima edição em breve
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {registrationsOpen ? (
                <Button
                  href="/inscricao"
                  size="lg"
                  variant="secondary"
                  className="bg-white text-accent-700 hover:bg-accent-50"
                >
                  Inscrever minha criança agora
                </Button>
              ) : (
                <Button
                  href="/contato"
                  size="lg"
                  variant="secondary"
                  className="bg-white text-accent-700 hover:bg-accent-50"
                >
                  Avise-me quando abrir
                </Button>
              )}
            </div>
            <p className="mt-4 text-sm text-white/70">
              Já é inscrito? O curso está na sua conta, em Formação.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-surface-muted py-20">
        <Container>
          <SectionHeading
            kicker="Perguntas frequentes"
            title="Tudo claro antes de começar"
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <h3 className="font-display text-lg font-extrabold text-primary-700">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm/6 text-ink-muted">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

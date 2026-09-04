import type { Metadata } from "next";
import Image from "next/image";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Camera,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Heart,
  ImageIcon,
  Share2,
  Smartphone,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getActiveContest } from "@/modules/contests/service";
import { PartnersShowcase } from "@/modules/content/components/partners-showcase";
import { listPartnersByType } from "@/modules/content/service";
import { SOCIAL } from "@/shared/contact";
import { buildEventJsonLd, JsonLd } from "@/shared/seo/json-ld";
import {
  Button,
  Card,
  Container,
  FacebookIcon,
  InstagramIcon,
  SectionHeading,
} from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: "Concurso Criança Mais Fotogênica do Brasil | Modelo Infantil",
  },
  description:
    "Inscreva sua criança no maior concurso de fotografia infantil do Brasil. Toda criança inscrita recebe uma foto profissional editada por IA e ganha de brinde o curso Como Gerenciar a Carreira do Seu Filho, da fundadora Claudia Cavalcante.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Concurso Criança Mais Fotogênica do Brasil",
    title: "Concurso Criança Mais Fotogênica do Brasil",
    description:
      "Inscrição online, foto profissional por IA e o curso de gestão de carreira infantil da Claudia Cavalcante grátis para todos os inscritos.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Concurso Criança Mais Fotogênica" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Concurso Criança Mais Fotogênica do Brasil",
    description:
      "Inscrição online, foto profissional por IA e o curso de gestão de carreira infantil da Claudia Cavalcante grátis para todos os inscritos.",
    images: ["/og-default.jpg"],
  },
};

const highlights = [
  {
    icon: Camera,
    title: "Avaliação técnica",
    description: "Fotos avaliadas por critérios claros de fotogenia, expressão e enquadramento.",
  },
  {
    icon: Trophy,
    title: "Reconhecimento nacional",
    description: "Os vencedores de cada categoria recebem o título e a faixa do concurso nacional.",
  },
  {
    icon: Heart,
    title: "Pensado para famílias",
    description: "Inscrição simples, comunicação direta e cuidado com os dados das crianças.",
  },
];

/** Pacote Participante Oficial — o que TODA criança inscrita recebe. */
const packageItems = [
  {
    icon: Sparkles,
    title: "Foto profissional",
    description:
      "Toda criança inscrita recebe uma foto editada por IA, com acabamento profissional, pronta para guardar e usar como portfólio.",
    hero: true,
  },
  {
    icon: BadgeCheck,
    title: "Participação oficial",
    description: "Protocolo de inscrição e categoria definida automaticamente pela idade da criança.",
  },
  {
    icon: Globe2,
    title: "Página pública",
    description: "Vitrine oficial da criança aprovada, com link para curtir e compartilhar.",
  },
  {
    icon: Share2,
    title: "Card de divulgação",
    description: "Imagem pronta para WhatsApp, Instagram e stories anunciando a participação.",
  },
  {
    icon: Award,
    title: "Certificado digital",
    description: "Certificado de participação com nome da criança, categoria e edição.",
  },
  {
    icon: ImageIcon,
    title: "Moldura oficial",
    description: "Moldura da edição aplicada às fotos, reforçando o pertencimento à edição 2026.",
  },
];

/** Conquistas em disputa — o upside da jornada. */
const prizes = [
  {
    icon: Award,
    title: "Faixa de vencedor",
    description:
      "Os vencedores de cada categoria recebem o título e a faixa de Criança Mais Fotogênica do Brasil. O reconhecimento máximo do concurso nacional.",
  },
  {
    icon: Sparkles,
    title: "Foto profissional",
    description:
      "Independentemente do resultado, todas as crianças inscritas saem com a foto profissional editada por IA.",
  },
  {
    icon: Smartphone,
    title: "Prêmio popular",
    description:
      "A foto mais curtida na votação popular do site leva um smartphone na Live Revelação.",
  },
];

/** Bullets da seção dedicada do curso premium (âncora de valor da inscrição). */
const courseBullets = [
  "27 capítulos práticos: mercado, cachês, contratos, golpes e negociação",
  "Método POFIA da Claudia para decidir como gestor, sem impulso",
  "Modelos prontos: dossiê do talento, plano 30/60/90 e checklists de proteção",
];

/**
 * Home pública. Hero + vídeo de apresentação da fundadora, Pacote Participante
 * Oficial (foto por IA como herói) e premiação focada na faixa nacional.
 * Estratégia: docs/06-estrategia-comercial-inscricoes.md.
 */
export default async function HomePage() {
  const [partners, contest] = await Promise.all([listPartnersByType(), getActiveContest()]);
  const priceLabel = formatCentsBRL(contest?.registrationFeeCents ?? 5400);
  const enrollCta = `Inscrever minha criança por ${priceLabel}`;

  return (
    <>
      {contest && (
        <JsonLd
          data={buildEventJsonLd({
            name: contest.name,
            description:
              "Concurso nacional de fotografia infantil com categorias por faixa etária, avaliação técnica e Live Revelação.",
            year: contest.year,
            startDate: contest.createdAt,
            endDate: contest.revealAt,
            url: "/",
          })}
        />
      )}
      {/* Hero — gradiente oficial da marca */}
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              19ª edição · inscrições abertas
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              O concurso nacional da criança mais fotogênica do Brasil
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Inscreva sua criança, receba uma <strong className="font-semibold">foto
              profissional editada por IA</strong> para usar como portfólio e concorra à
              faixa de vencedor do maior concurso de fotogenia infantil do país.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                href="/inscricao"
                size="lg"
                variant="secondary"
                className="bg-white text-accent-700 hover:bg-accent-50"
              >
                {enrollCta}
              </Button>
              <Button
                href="#apresentacao"
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Assistir à apresentação
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/80">
              Leva cerca de 5 minutos. Você envia 2 fotos, garante a participação oficial e
              ainda ganha de brinde o curso de gestão de carreira infantil escrito pela
              fundadora Claudia Cavalcante.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <Image
              src="/people/live-revelacao-selfie.jpg"
              alt="Claudia Cavalcante e crianças participantes tirando uma selfie durante a Live Revelação do concurso"
              width={896}
              height={598}
              priority
              quality={75}
              sizes="(min-width: 768px) 28rem, 100vw"
              className="rounded-bubble border-4 border-white/30 object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-3xl bg-white px-5 py-4 shadow-brand-lg lg:-left-6 lg:translate-x-0">
              <p className="font-display text-2xl font-extrabold text-brand-gradient">
                5 categorias
              </p>
              <p className="text-sm font-semibold text-ink-muted">do bebê ao teen</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Apresentação da fundadora — vídeo */}
      <section id="apresentacao" className="scroll-mt-24 py-20">
        <Container>
          <SectionHeading
            kicker="Conheça quem realiza"
            title="A apresentação da fundadora"
            description="Claudia Cavalcante conta como funciona o concurso, o que sua criança recebe e por que tantas famílias participam todos os anos."
          />
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-bubble border border-primary-100 shadow-brand-lg">
            <video
              controls
              preload="none"
              poster="/video/apresentacao-fundadora-poster.jpg"
              className="aspect-video w-full bg-ink"
            >
              <source src="/video/apresentacao-fundadora.mp4" type="video/mp4" />
              Seu navegador não suporta a reprodução de vídeo.
            </video>
          </div>
        </Container>
      </section>

      {/* Pacote Participante Oficial — valor garantido para todos */}
      <section className="bg-surface-muted py-20">
        <Container>
          <SectionHeading
            kicker="O que você recebe ao participar"
            title="Muito mais do que uma inscrição"
            description="Toda criança inscrita garante o Pacote Participante Oficial 2026 — com valor real desde o primeiro dia, mesmo antes de qualquer resultado."
          />
          {/* Curso premium — âncora de valor do pacote */}
          <div className="mt-12 overflow-hidden rounded-bubble border border-accent-200 bg-gradient-to-br from-primary-700 to-primary-600 text-white shadow-brand-lg">
            <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-widest">
                  <GraduationCap aria-hidden className="h-4 w-4" />
                  Brinde para todos os inscritos
                </p>
                <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                  Curso: Como Gerenciar a Carreira do Seu Filho
                </h3>
                <p className="mt-3 max-w-2xl text-white/85">
                  O curso completo de gestão de carreira infantil, escrito pela fundadora
                  Claudia Cavalcante, liberado gratuitamente para todos os inscritos
                  confirmados desta edição. Método, valores reais de mercado e proteção da
                  infância em 27 capítulos.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen aria-hidden className="h-4 w-4" />
                    27 capítulos práticos
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 aria-hidden className="h-4 w-4" />
                    Acesso liberado após a confirmação
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end lg:text-right">
                <p className="text-sm text-white/70 line-through">Valor do curso R$ 350,00</p>
                <p className="font-display text-xl font-extrabold">
                  Grátis para todos os inscritos
                </p>
                <Button
                  href="/curso"
                  variant="secondary"
                  className="bg-white text-accent-700 hover:bg-accent-50"
                >
                  Conhecer o curso
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packageItems.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className={
                    item.hero
                      ? "border-accent-200 bg-accent-50/60 ring-2 ring-accent-200 md:col-span-2 lg:col-span-1"
                      : undefined
                  }
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-primary-700">
                    {item.title}
                    {item.hero && (
                      <span className="rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                        Para todos
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm/6 text-ink-muted">{item.description}</p>
                </Card>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button href="/inscricao" size="lg">
              {enrollCta}
            </Button>
          </div>
        </Container>
      </section>

      {/* Premiação — a faixa nacional é o herói */}
      <section className="py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <Image
              src="/people/child-winner-sash.png"
              alt="Criança vestindo a faixa de vencedora do concurso"
              width={640}
              height={640}
              quality={75}
              sizes="(min-width: 1024px) 24rem, 100vw"
              className="rounded-bubble object-cover"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              kicker="Premiação 2026"
              title="A faixa que celebra a sua criança"
              description="Simplificamos a premiação para o que realmente importa: reconhecimento nacional para os vencedores e valor garantido para todos os inscritos."
            />
            <div className="mt-8 space-y-4">
              {prizes.map((prize) => {
                const Icon = prize.icon;

                return (
                  <div key={prize.title} className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-primary-700">
                        {prize.title}
                      </h3>
                      <p className="mt-1 text-sm/6 text-ink-muted">{prize.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Curso premium — seção dedicada de percepção de valor */}
      <section id="curso" className="scroll-mt-24 bg-surface-muted py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative mx-auto w-full max-w-md">
            <Image
              src="/academy/promo-phone.jpg"
              alt="Celular exibindo o curso Como Gerenciar a Carreira do Seu Filho, de Claudia Cavalcante"
              width={1536}
              height={1024}
              quality={80}
              sizes="(min-width: 1024px) 28rem, 100vw"
              className="rounded-bubble object-cover shadow-brand-lg"
            />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-3xl bg-white px-5 py-3 shadow-brand-lg">
              <p className="font-display text-lg font-extrabold text-brand-gradient">
                Grátis para inscritos confirmados
              </p>
              <p className="text-xs font-semibold text-ink-muted">brinde desta edição</p>
            </div>
          </div>

          <div>
            <SectionHeading
              align="left"
              kicker="Brinde premium 2026"
              title="O curso que transforma pais em gestores de carreira"
              description="Curso escrito pela fundadora Claudia Cavalcante, com mais de vinte anos de experiência reunidos em 27 capítulos. Um curso que custa R$ 350 e que, nesta edição, fica gratuito para todas as famílias com inscrição confirmada."
            />
            <ul className="mt-8 space-y-3">
              {courseBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent-600"
                  />
                  <span className="text-sm/6 text-ink-muted">{bullet}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-muted">
              Sem promessa de fama ou contrato garantido: método, critério e proteção da
              infância, no ritmo da sua família.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/inscricao" size="lg">
                Inscrever e destravar o curso
              </Button>
              <Button href="/curso" variant="outline" size="lg">
                Ver o conteúdo completo
              </Button>
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

      {/* Categorias */}
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
        </Container>
      </section>

      {/* Instagram — canal oficial de notícias e lembretes da edição */}
      <section className="py-20">
        <Container>
          <div className="overflow-hidden rounded-bubble bg-brand-gradient px-6 py-12 text-center text-white shadow-brand-lg sm:px-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <InstagramIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-widest text-white/75">
              Acompanhe de perto
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-extrabold sm:text-4xl">
              Siga o concurso no Instagram
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Notícias da edição, lembretes de prazos, bastidores e os anúncios
              oficiais saem primeiro no perfil{" "}
              <strong className="font-semibold text-white">{SOCIAL.instagram.handle}</strong>.
              Siga para não perder nenhuma etapa do concurso.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                href={SOCIAL.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="secondary"
                className="bg-white text-accent-700 hover:bg-accent-50"
              >
                <InstagramIcon className="h-5 w-5" />
                Seguir no Instagram
              </Button>
              <a
                href={SOCIAL.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-display font-bold text-white/90 transition hover:text-white"
              >
                <FacebookIcon className="h-5 w-5" />
                Também estamos no Facebook
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Prova social — números e Live Revelação
      <section className="bg-surface-muted py-20">
        <Container>
          <SectionHeading
            kicker="Uma história que já é tradição"
            title="Famílias de todo o Brasil já viveram essa experiência"
            description="São 19 edições celebrando a infância, com os resultados revelados ao vivo na Live Revelação no YouTube."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center">
                <p className="font-display text-4xl font-extrabold text-brand-gradient">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm/6 text-ink-muted">{stat.label}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section> */}

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

      {/* CTA final — preço + urgência */}
      <section className="bg-brand-gradient text-white">
        <Container className="py-20 text-center">
          <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">
            As inscrições da 19ª edição estão abertas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Garanta a participação da sua criança antes do encerramento: foto profissional
            por IA e, de brinde, o curso de gestão de carreira infantil da fundadora
            Claudia Cavalcante, gratuito para todos os inscritos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              href="/inscricao"
              size="lg"
              variant="secondary"
              className="bg-white text-accent-700 hover:bg-accent-50"
            >
              {enrollCta}
            </Button>
            <Button
              href="/o-concurso"
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Conhecer o concurso
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

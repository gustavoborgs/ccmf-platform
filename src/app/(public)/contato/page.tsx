import type { Metadata } from "next";
import { HelpCircle, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { ContactForm } from "@/modules/content/components/contact-form";
import { buildWhatsAppUrl, CONTACT } from "@/shared/contact";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a equipe do Concurso Criança Mais Fotogênica pelo WhatsApp, telefone ou e-mail oficial.",
};

const WHATSAPP_MESSAGES = {
  general: "Olá! Vim pelo site do CCMF e gostaria de falar com a equipe.",
};

const contactCards = [
  {
    title: "WhatsApp oficial",
    value: CONTACT.whatsapp.display,
    description: "Canal principal para atendimento rápido com a equipe do concurso.",
    icon: MessageCircle,
  },
  {
    title: "Telefone",
    value: CONTACT.phone.display,
    description: "Use este número como referência oficial, mas prefira iniciar pelo WhatsApp.",
    icon: Phone,
  },
  {
    title: "E-mail",
    value: CONTACT.email,
    description: "Contato oficial para mensagens formais e conferência de informações.",
    icon: Mail,
  },
];

const faqItems = [
  {
    question: "Como faço a inscrição?",
    answer:
      "A inscrição é feita online pelo site. Se tiver dificuldade em qualquer etapa, inicie uma conversa no WhatsApp para receber orientação.",
  },
  {
    question: "Quantas fotos preciso enviar?",
    answer:
      "A inscrição solicita 2 fotos em formato retrato. A equipe pode orientar sobre formato, enquadramento e envio pelo WhatsApp.",
  },
  {
    question: "Como confirmo meu pagamento?",
    answer:
      "A confirmação acontece pela plataforma após o processamento do pagamento. Para dúvidas sobre status, chame a equipe no WhatsApp.",
  },
  {
    question: "Onde vejo regras, categorias e prazos?",
    answer:
      "As informações oficiais ficam no regulamento da edição. Se algum item não estiver claro, fale com a equipe antes de concluir a inscrição.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-gradient text-white">
        <Container className="grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
              Contato
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Tire suas dúvidas com a equipe do CCMF
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Reunimos os canais oficiais de atendimento, mas o caminho mais rápido
              é iniciar uma conversa pelo WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="secondary"
                className="bg-white text-accent-700 hover:bg-accent-50"
              >
                Iniciar conversa no WhatsApp
              </Button>
              <Button href="/regulamento" size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Ver regulamento
              </Button>
            </div>
          </div>

          <Card className="border-white/25 bg-white/95 text-ink shadow-brand-lg">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                <MessageCircle aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
                  Atendimento principal
                </p>
                <h2 className="text-2xl font-extrabold text-primary-700">
                  WhatsApp {CONTACT.whatsapp.display}
                </h2>
              </div>
            </div>
            <p className="mt-5 text-ink-muted">
              Ao clicar nos botões desta página, você abre o WhatsApp com uma
              mensagem inicial pronta para agilizar o atendimento, sem precisar
              procurar o número manualmente.
            </p>
          </Card>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Canais oficiais"
            title="Todos os contatos em um só lugar"
            description="Confira os dados oficiais do concurso. O WhatsApp segue como canal principal para atendimento."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {contactCards.map((contact) => {
              const Icon = contact.icon;

              return (
                <Card key={contact.title} className="flex h-full flex-col">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-extrabold text-primary-700">
                    {contact.title}
                  </h2>
                  <p className="mt-1 font-semibold text-ink">{contact.value}</p>
                  <p className="mt-3 flex-1 text-sm/6 text-ink-muted">{contact.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* <section className="bg-surface-muted py-20">
        <Container>
          <SectionHeading
            kicker="Envie uma mensagem"
            title="Prefere escrever? Fale com a gente por aqui"
            description="Sua mensagem chega direto para a organização do concurso e a resposta vai para o e-mail informado."
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="flex h-full flex-col bg-brand-gradient text-white">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <Send aria-hidden="true" className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-extrabold">
                Atendimento com cuidado de gente
              </h2>
              <p className="mt-3 text-white/85">
                Cada mensagem é lida pela equipe organizadora. Use este formulário
                para dúvidas detalhadas, sugestões ou assuntos formais.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-white/85">
                <li className="rounded-2xl bg-white/10 px-4 py-3">
                  <strong className="font-bold text-white">Inscrições e fotos</strong> — orientação
                  completa sobre o envio.
                </li>
                <li className="rounded-2xl bg-white/10 px-4 py-3">
                  <strong className="font-bold text-white">Pagamentos</strong> — status e confirmação
                  da participação.
                </li>
                <li className="rounded-2xl bg-white/10 px-4 py-3">
                  <strong className="font-bold text-white">Parcerias</strong> — proposta para apoiar a
                  próxima edição.
                </li>
              </ul>
            </Card>

            <Card className="bg-white">
              <ContactForm />
            </Card>
          </div>
        </Container>
      </section> */}

      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Dúvidas frequentes"
            title="Antes de chamar, veja respostas rápidas"
            description="Se a dúvida continuar, use o botão de WhatsApp no início ou no fim da página para falar com a equipe."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.question} className="bg-white">
                <div className="flex gap-4">
                  <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                    <HelpCircle aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-primary-700">
                      {item.question}
                    </h2>
                    <p className="mt-3 text-sm/6 text-ink-muted">{item.answer}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="rounded-bubble bg-brand-gradient px-6 py-12 text-center text-white shadow-brand-lg sm:px-10">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-white/75">
              Atendimento direto
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Pronto para falar com a equipe?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Inicie uma conversa pelo WhatsApp e envie sua dúvida sobre inscrição,
              fotos, pagamento, regulamento ou acompanhamento da participação.
            </p>
            <Button
              href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="secondary"
              className="mt-8 bg-white text-accent-700 hover:bg-accent-50"
            >
              Iniciar conversa no WhatsApp
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

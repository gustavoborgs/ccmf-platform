import { cookies } from "next/headers";
import Link from "next/link";
import { Award, Clock, Globe2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { getActiveContest } from "@/modules/contests/service";
import {
  getWizardStateFromRef,
  resolveResumeLink,
} from "@/modules/registrations/service";
import { WIZARD_REF_COOKIE } from "@/modules/registrations/wizard-cookie";
import { EnrollmentWizard } from "@/modules/registrations/components/enrollment-wizard";
import type {
  WizardInitialState,
  WizardUiStep,
} from "@/modules/registrations/components/wizard-types";
import { Container } from "@/shared/ui/container";
import { formatCentsBRL, maskEmail, maskPhone } from "@/shared/utils";

/**
 * Wizard de inscrição (3 steps). A fonte de verdade do andamento é o ref
 * assinado, vindo da URL (?ref=) ou do cookie local de retomada.
 * Spec: docs/modules/registrations.md
 */
export const dynamic = "force-dynamic";

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string; ref?: string }>;
}) {
  const [{ lead: leadId, ref: queryRef }, cookieStore] = await Promise.all([
    searchParams,
    cookies(),
  ]);
  const cookieRef = cookieStore.get(WIZARD_REF_COOKIE)?.value;
  const rawRef = queryRef ?? cookieRef;

  const contest = await getActiveContest();
  if (!contest) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-3xl font-extrabold text-primary-700">Inscrições encerradas</h1>
        <p className="mt-4 text-ink-muted">
          As inscrições não estão abertas no momento. Acompanhe nossas redes para a próxima edição!
        </p>
      </Container>
    );
  }

  const feeFormatted = formatCentsBRL(contest.registrationFeeCents);
  const initial: WizardInitialState = {
    step: "guardian",
    ref: null,
    registrationId: null,
    photosCount: 0,
    paymentPending: false,
    summary: null,
    feeFormatted,
    feeCents: contest.registrationFeeCents,
  };

  // Prefill de lead (link de retomada pré-conta) — dados mascarados.
  if (leadId) {
    const resume = await resolveResumeLink(leadId);
    if (resume?.kind === "PRE_ACCOUNT") {
      initial.prefill = {
        name: resume.prefill.name ?? undefined,
        emailMasked: resume.prefill.email ? maskEmail(resume.prefill.email) : undefined,
        phoneMasked: resume.prefill.phone ? maskPhone(resume.prefill.phone) : undefined,
      };
    }
  }

  // Retomada via ref assinado da URL ou cookie local; ref inválido é ignorado.
  const refState = await getWizardStateFromRef(rawRef);

  if (refState) {
    initial.ref = rawRef ?? null;
    initial.step = "participant";

    const registration = refState.registration;
    if (registration && ["DRAFT", "PENDING_PAYMENT"].includes(registration.status)) {
      initial.registrationId = registration.id;
      initial.photosCount = registration._count.photos;
      initial.paymentPending = registration.status === "PENDING_PAYMENT";
      initial.summary = {
        protocol: registration.protocol,
        participantName: registration.participant.name,
        categoryName: registration.category.name,
        feeFormatted,
        feeCents: contest.registrationFeeCents,
      };
      initial.participant = {
        name: registration.participant.name,
        birthDate: registration.participant.birthDate.toISOString().slice(0, 10),
        gender: registration.participant.gender ?? "",
        city: registration.participant.city,
        state: registration.participant.state,
      };

      const step: WizardUiStep =
        registration.status === "PENDING_PAYMENT" || registration._count.photos >= 2
          ? "summary"
          : "photos";
      initial.step = step;
    }
  }

  const packagePerks = [
    {
      icon: Sparkles,
      title: "Foto profissional",
      description: "Todos recebem uma foto profissional editada pela nossa IA, pronta para usar como portfólio.",
    },
    {
      icon: Globe2,
      title: "Página do participante",
      description: "Portfólio digital da criança para curtir e compartilhar nas redes sociais.",
    },
    {
      icon: Award,
      title: "Concorra à faixa de vencedor",
      description: "O título de Criança Mais Fotogênica Brasil, por categoria de idade.",
    },
  ];

  const totalValueLabel = formatCentsBRL(contest.registrationFeeCents + 35000);

  return (
    <Container className="py-14">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          <span className="text-brand-gradient">Inscrição {contest.year}</span>
        </h1>
        <p className="mt-3 text-ink-muted">
          Taxa única de <strong className="text-accent-700">{feeFormatted}</strong>. Você já garante
          a foto profissional por IA e concorre na categoria da idade da sua criança.
        </p>
      </div>

      {/* Painel de oferta + confiança antes do wizard */}
      <div className="mx-auto mb-8 max-w-2xl rounded-bubble border border-primary-100 bg-surface-muted p-6 shadow-brand sm:p-8">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
          O que sua criança recebe
        </p>

        {/* Curso premium — âncora de valor da oferta */}
        <Link
          href="/curso"
          className="mt-4 flex gap-3 rounded-bubble border border-accent-200 bg-gradient-to-r from-primary-700 to-primary-600 p-4 text-white shadow-brand transition hover:brightness-110"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            <GraduationCap aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-extrabold">
                Curso: Como Gerenciar a Carreira do Seu Filho
              </span>
              <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                R$ 350 incluso
              </span>
            </span>
            <span className="mt-0.5 block text-xs/5 text-white/80">
              27 capítulos de gestão de carreira infantil por Claudia Cavalcante. Acesso liberado
              na confirmação do pagamento.
            </span>
          </span>
        </Link>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {packagePerks.map((perk) => {
            const Icon = perk.icon;

            return (
              <div key={perk.title} className="flex gap-3 sm:flex-col">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-extrabold text-primary-700">
                    {perk.title}
                  </p>
                  <p className="mt-0.5 text-xs/5 text-ink-muted">{perk.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 rounded-2xl bg-accent-50 px-4 py-3 text-center text-sm text-primary-700">
          Somando o curso, são mais de{" "}
          <strong className="text-accent-700">{totalValueLabel} em valor</strong> pela taxa única
          de <strong className="text-accent-700">{feeFormatted}</strong>.
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-primary-100 pt-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <Clock aria-hidden="true" className="size-4 text-primary-600" />
            Leva cerca de 5 minutos
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary-600" />
            Ambiente seguro · 19ª edição nacional
          </span>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Tenha em mãos: CPF do responsável, dados da criança e 2 fotos no formato retrato. A
          categoria é definida automaticamente pela idade. Veja o{" "}
          <a href="/regulamento" target="_blank" className="font-bold text-accent-700 underline">
            regulamento
          </a>
          .
        </p>
      </div>

      <EnrollmentWizard initial={initial} />
    </Container>
  );
}

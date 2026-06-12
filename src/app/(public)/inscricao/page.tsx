import { cookies } from "next/headers";
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

  return (
    <Container className="py-14">
      <div className="mx-auto mb-10 max-w-xl text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          <span className="text-brand-gradient">Inscrição {contest.year}</span>
        </h1>
        <p className="mt-3 text-ink-muted">
          Taxa de inscrição: <strong className="text-accent-700">{feeFormatted}</strong> · Envie 2
          fotos no formato retrato e concorra na categoria da idade da sua criança.
        </p>
      </div>

      <EnrollmentWizard initial={initial} />
    </Container>
  );
}

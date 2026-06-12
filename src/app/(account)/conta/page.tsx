import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/modules/auth/actions";
import { requireRole } from "@/modules/auth/guards";
import { FramedPhotoDownload } from "@/modules/media/components/framed-photo-download";
import {
  getGuardianByUserId,
  listGuardianRegistrations,
} from "@/modules/registrations/service";
import {
  CancelRegistrationButton,
  GuardianPhotoManager,
} from "@/modules/registrations/components/account-registration-actions";
import { PhotoReview, type ReviewPhoto } from "@/modules/registrations/components/photo-review";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card, Container, cn } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

/**
 * Área do responsável: acompanhar inscrições, baixar foto com moldura,
 * realizar novas inscrições. Spec: docs/modules/registrations.md
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("GUARDIAN");
  const guardian = await getGuardianByUserId(user.id);
  if (!guardian) redirect("/inscricao");

  const registrations = await listGuardianRegistrations(guardian.id);

  const years = [...new Set(registrations.map((registration) => registration.contest.year))].sort(
    (a, b) => b - a,
  );
  const rawParams = await searchParams;
  const requestedYear = Number.parseInt(String(rawParams.ano ?? ""), 10);
  const selectedYear = years.includes(requestedYear) ? requestedYear : null;
  const visibleRegistrations = selectedYear
    ? registrations.filter((registration) => registration.contest.year === selectedYear)
    : registrations;

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Minha conta
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Minhas inscrições</h1>
          <p className="mt-2 text-ink-muted">Olá, {user.name}. Acompanhe aqui o andamento de cada inscrição.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button href="/inscricao" variant="secondary">
            Nova inscrição
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        </div>
      </div>

      {years.length > 1 && (
        <nav aria-label="Filtrar por edição" className="mt-8 flex flex-wrap gap-2">
          <YearBadge href="/conta" active={selectedYear === null}>
            Todas
          </YearBadge>
          {years.map((year) => (
            <YearBadge key={year} href={`/conta?ano=${year}`} active={selectedYear === year}>
              Edição {year}
            </YearBadge>
          ))}
        </nav>
      )}

      {registrations.length === 0 ? (
        <Card className="mt-10 text-center">
          <h2 className="text-2xl font-extrabold text-primary-700">Nenhuma inscrição ainda</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Quando você inscrever uma criança, o protocolo e os próximos passos aparecerão aqui.
          </p>
          <Button href="/inscricao" className="mt-6">
            Fazer primeira inscrição
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5">
          {visibleRegistrations.map((registration) => {
            const latestPayment = registration.payments[0];
            const status = getAccountStatus(registration.status, registration._count.photos);
            const resumeHref = `/inscricao/retomar/${registration.protocol}`;
            const frameUrl = registration.contest.frameImageKey
              ? getPublicUrl(registration.contest.frameImageKey)
              : null;
            const canDownloadFramedPhotos = isPaymentConfirmed(registration.status);
            const canManage = ["DRAFT", "PENDING_PAYMENT"].includes(registration.status);
            const photos: ReviewPhoto[] = registration.photos.map((photo) => ({
              id: photo.id,
              url: getPublicUrl(photo.storageKey),
              order: photo.order,
              isCover: photo.isCover,
              width: photo.width,
              height: photo.height,
            }));

            return (
              <Card key={registration.id}>
                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <div className="space-y-6">
                    <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-700">
                        {registration.protocol}
                      </span>
                      <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-accent-700">
                        {status.label}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-extrabold text-primary-700">
                      {registration.participant.name}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">
                      Edição {registration.contest.year} · {registration.category.name}
                    </p>

                    <p className="mt-4 max-w-2xl text-ink-muted">{status.description}</p>

                    {registration.status === "REJECTED" && registration.rejectionReason && (
                      <p className="mt-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
                        Motivo: {registration.rejectionReason}
                      </p>
                    )}
                    </div>

                    <div className="rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-primary-700/60">
                          Pagamento
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
                            latestPayment
                              ? paymentStatusTone[latestPayment.status]
                              : "bg-primary-50 text-primary-700",
                          )}
                        >
                          {latestPayment ? paymentStatusLabel[latestPayment.status] : "Sem cobrança"}
                        </span>
                      </div>
                      {latestPayment ? (
                        <div className="mt-2 text-sm text-ink">
                          <p className="font-semibold">
                            {paymentMethodLabel[latestPayment.method]} ·{" "}
                            {formatCentsBRL(latestPayment.amountCents)}
                          </p>
                          {latestPayment.status === "PENDING" && latestPayment.dueDate && (
                            <p className="mt-1 text-xs text-ink-muted">
                              Vencimento: {formatDate(latestPayment.dueDate)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-ink-muted">
                          A cobrança aparece aqui assim que você concluir o checkout.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-extrabold text-primary-700">
                        Dados cadastrados
                      </h3>
                      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        <AccountDetail label="Criança" value={registration.participant.name} />
                        <AccountDetail label="Categoria" value={registration.category.name} />
                        <AccountDetail
                          label="Cidade/UF"
                          value={`${registration.participant.city}/${registration.participant.state}`}
                        />
                        <AccountDetail
                          label="Data de nascimento"
                          value={formatDate(registration.participant.birthDate)}
                        />
                        <AccountDetail
                          label="Consentimento de imagem"
                          value={registration.participant.imageConsentAt ? "Aceito" : "Pendente"}
                        />
                        <AccountDetail label="Edição" value={String(registration.contest.year)} />
                      </dl>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {status.cta === "resume" && (
                        <Button href={resumeHref} variant="secondary">
                          Continuar inscrição
                        </Button>
                      )}
                      {status.cta === "payment" && (
                        <Button href={resumeHref} variant="secondary">
                          Retomar pagamento
                        </Button>
                      )}
                      {status.cta === "public" && (
                        <Button
                          href={`/participantes/${registration.contest.year}/${registration.participant.slug}`}
                          variant="outline"
                        >
                          Ver página pública
                        </Button>
                      )}
                      {canManage && (
                        <CancelRegistrationButton
                          registrationId={registration.id}
                          participantName={registration.participant.name}
                          protocol={registration.protocol}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-display text-lg font-extrabold text-primary-700">
                      Fotos anexadas para participação
                    </h3>
                    {canManage ? (
                      <GuardianPhotoManager
                        registrationId={registration.id}
                        photos={photos.map((photo) => ({
                          id: photo.id,
                          url: photo.url,
                          order: photo.order,
                          isCover: photo.isCover,
                        }))}
                      />
                    ) : (
                      <PhotoReview
                        photos={photos}
                        emptyTitle="Nenhuma foto anexada"
                        emptyDescription="Continue a inscrição para enviar as 2 fotos obrigatórias."
                      />
                    )}

                    {canDownloadFramedPhotos && photos.length > 0 && (
                      <div className="mt-5">
                        {frameUrl ? (
                          <FramedPhotoDownload
                            photos={photos}
                            frameUrl={frameUrl}
                            participantName={registration.participant.name}
                          />
                        ) : (
                          <p className="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-ink-muted">
                            Assim que a moldura desta edição for configurada, o download das fotos
                            oficiais ficará disponível aqui.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {visibleRegistrations.length === 0 && (
            <Card className="text-center">
              <h2 className="text-xl font-extrabold text-primary-700">
                Nenhuma inscrição nesta edição
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
                Escolha outra edição acima ou faça uma nova inscrição.
              </p>
            </Card>
          )}
        </div>
      )}
    </Container>
  );
}

function YearBadge({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-1.5 font-display text-sm font-bold transition",
        active
          ? "bg-accent-600 text-white shadow-brand"
          : "border border-primary-100 bg-white text-primary-700 hover:bg-primary-50",
      )}
    >
      {children}
    </Link>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-50/70 px-4 py-3">
      <dt className="text-xs font-extrabold uppercase tracking-wide text-primary-700/60">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

type AccountStatus = {
  label: string;
  description: string;
  cta: "resume" | "payment" | "public" | null;
};

function getAccountStatus(status: string, photosCount: number): AccountStatus {
  if (status === "DRAFT") {
    return photosCount < 2
      ? {
          label: "Fotos pendentes",
          description: "Envie as 2 fotos obrigatórias para liberar o checkout da inscrição.",
          cta: "resume",
        }
      : {
          label: "Pronta para pagamento",
          description: "As fotos foram enviadas. Conclua o pagamento para confirmar a inscrição.",
          cta: "payment",
        };
  }

  if (status === "PENDING_PAYMENT") {
    return {
      label: "Aguardando pagamento",
      description: "A cobrança foi gerada e a confirmação acontece automaticamente pelo Asaas.",
      cta: "payment",
    };
  }

  if (status === "PAID" || status === "UNDER_REVIEW") {
    return {
      label: status === "PAID" ? "Pagamento confirmado" : "Em análise",
      description: "Recebemos o pagamento. A equipe fará a análise antes da publicação no site.",
      cta: null,
    };
  }

  if (status === "APPROVED" || status === "SEMIFINALIST" || status === "WINNER") {
    return {
      label: statusLabel[status],
      description: "A inscrição está aprovada e pode aparecer na galeria pública do concurso.",
      cta: "public",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "Inscrição recusada",
      description: "A inscrição foi recusada após análise da equipe.",
      cta: null,
    };
  }

  return {
    label: "Em andamento",
    description: "Acompanhe as próximas etapas por aqui.",
    cta: null,
  };
}

function isPaymentConfirmed(status: string): boolean {
  return ["PAID", "UNDER_REVIEW", "APPROVED", "SEMIFINALIST", "WINNER"].includes(status);
}

const statusLabel: Record<string, string> = {
  APPROVED: "Aprovada",
  SEMIFINALIST: "Semifinalista",
  WINNER: "Vencedora",
};

const paymentMethodLabel: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  RECEIVED: "Recebido",
  OVERDUE: "Vencido",
  REFUNDED: "Reembolsado",
  CANCELED: "Cancelado",
  FAILED: "Falhou",
};

const paymentStatusTone: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-800",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  RECEIVED: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-red-50 text-red-700",
  REFUNDED: "bg-sky-50 text-sky-700",
  CANCELED: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
};

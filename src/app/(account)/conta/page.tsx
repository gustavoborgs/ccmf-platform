import { redirect } from "next/navigation";
import { logoutAction } from "@/modules/auth/actions";
import { requireRole } from "@/modules/auth/guards";
import { FramedPhotoDownload } from "@/modules/media/components/framed-photo-download";
import {
  getGuardianByUserId,
  listGuardianRegistrations,
} from "@/modules/registrations/service";
import { PhotoReview, type ReviewPhoto } from "@/modules/registrations/components/photo-review";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card, Container } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

/**
 * Área do responsável: acompanhar inscrições, baixar foto com moldura,
 * realizar novas inscrições. Spec: docs/modules/registrations.md
 */
export default async function AccountPage() {
  const user = await requireRole("GUARDIAN");
  const guardian = await getGuardianByUserId(user.id);
  if (!guardian) redirect("/inscricao");

  const registrations = await listGuardianRegistrations(guardian.id);

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
        <div className="mt-10 grid gap-5">
          {registrations.map((registration) => {
            const latestPayment = registration.payments[0];
            const status = getAccountStatus(registration.status, registration._count.photos);
            const resumeHref = `/inscricao/retomar/${registration.protocol}`;
            const frameUrl = registration.contest.frameImageKey
              ? getPublicUrl(registration.contest.frameImageKey)
              : null;
            const canDownloadFramedPhotos = isPaymentConfirmed(registration.status);
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

                    {latestPayment && (
                      <p className="mt-4 text-sm text-ink-muted">
                        Último pagamento: {paymentMethodLabel[latestPayment.method]} ·{" "}
                        {paymentStatusLabel[latestPayment.status]} ·{" "}
                        {formatCentsBRL(latestPayment.amountCents)}
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
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-display text-lg font-extrabold text-primary-700">
                      Fotos anexadas para participação
                    </h3>
                    <PhotoReview
                      photos={photos}
                      emptyTitle="Nenhuma foto anexada"
                      emptyDescription="Continue a inscrição para enviar as 2 fotos obrigatórias."
                    />

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
        </div>
      )}
    </Container>
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
  PENDING: "pendente",
  CONFIRMED: "confirmado",
  RECEIVED: "recebido",
  OVERDUE: "vencido",
  REFUNDED: "reembolsado",
  CANCELED: "cancelado",
  FAILED: "falhou",
};

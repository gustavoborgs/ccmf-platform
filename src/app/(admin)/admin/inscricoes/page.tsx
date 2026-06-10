import { PhotoReview, type ReviewPhoto } from "@/modules/registrations/components/photo-review";
import { RegistrationReviewActions } from "@/modules/registrations/components/registration-review-actions";
import { listContestFilterOptions } from "@/modules/contests/service";
import { listAdminRegistrations } from "@/modules/registrations/service";
import {
  adminRegistrationFiltersSchema,
  REGISTRATION_STATUSES,
} from "@/modules/registrations/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { formatCentsBRL } from "@/shared/utils";
import {
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import {
  DetailGrid,
  DetailSection,
  formatDateTime,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminRegistrationRow = Awaited<ReturnType<typeof listAdminRegistrations>>["items"][number];

const columns: DataTableColumn<AdminRegistrationRow>[] = [
  {
    id: "participant",
    header: "Participante",
    cell: (registration) => (
      <div>
        <p className="font-bold">{registration.participant.name}</p>
        <p className="text-ink-muted">{registration.protocol}</p>
      </div>
    ),
  },
  {
    id: "registration",
    header: "Inscrição",
    cell: (registration) => (
      <div className="space-y-2">
        <p className="font-bold text-primary-700">
          {registration.contest.year} · {registration.category.name}
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={registrationStatusTone(registration.status)}>
            {registrationStatusLabel(registration.status)}
          </StatusBadge>
          <StatusBadge tone={registration._count.photos >= 2 ? "success" : "warning"}>
            {registration._count.photos}/2 fotos
          </StatusBadge>
        </div>
      </div>
    ),
  },
  {
    id: "guardian",
    header: "Responsável",
    cell: (registration) => {
      const guardian = registration.participant.guardian.user;
      return (
        <div>
          <p className="font-bold">{guardian.name}</p>
          <p className="text-ink-muted">{guardian.email}</p>
        </div>
      );
    },
  },
  {
    id: "payment",
    header: "Pagamento",
    cell: (registration) => {
      const latestPayment = registration.payments[0];
      if (!latestPayment) return <p className="text-ink-muted">Sem checkout</p>;
      return (
        <div className="space-y-1">
          <StatusBadge tone={paymentStatusTone(latestPayment.status)}>
            {paymentStatusLabel(latestPayment.status)}
          </StatusBadge>
          <p className="text-ink-muted">
            {paymentMethodLabel(latestPayment.method)} · {formatCentsBRL(latestPayment.amountCents)}
          </p>
        </div>
      );
    },
  },
  {
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (registration) => <RegistrationDetailsDialog registration={registration} />,
  },
];

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminRegistrationFiltersSchema.parse(await searchParams);
  const [{ items: registrations, pagination }, contests] = await Promise.all([
    listAdminRegistrations(filters),
    listContestFilterOptions(),
  ]);

  const categoryOptions = filters.year
    ? (contests.find((contest) => contest.year === filters.year)?.categories ?? [])
    : contests.flatMap((contest) =>
        contest.categories.map((category) => ({
          ...category,
          name: `${contest.year} · ${category.name}`,
        })),
      );

  const tableFilters: DataTableFilter[] = [
    {
      id: "year",
      label: "Ano",
      options: contests.map((contest) => ({
        value: String(contest.year),
        label: String(contest.year),
      })),
    },
    {
      id: "categoryId",
      label: "Categoria",
      options: categoryOptions.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    },
    {
      id: "status",
      label: "Status",
      options: REGISTRATION_STATUSES.map((status) => ({
        value: status,
        label: registrationStatusLabel(status),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          Inscrições
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Fila de inscrições</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Acompanhe o caminho até a inscrição confirmada: rascunho, fotos, checkout, pagamento e
          revisão operacional. Ordenadas pela última atualização.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar
          searchPlaceholder="Participante, protocolo ou responsável"
          filters={tableFilters}
        />
        <DataTable
          columns={columns}
          rows={registrations}
          rowKey={(registration) => registration.id}
          emptyMessage="Nenhuma inscrição encontrada para os filtros atuais."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function RegistrationDetailsDialog({ registration }: { registration: AdminRegistrationRow }) {
  const guardian = registration.participant.guardian.user;
  const latestPayment = registration.payments[0];
  const photos: ReviewPhoto[] = registration.photos.map((photo) => ({
    id: photo.id,
    url: getPublicUrl(photo.storageKey),
    order: photo.order,
    isCover: photo.isCover,
    width: photo.width,
    height: photo.height,
  }));

  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DialogTitle>{registration.participant.name}</DialogTitle>
            <DialogDescription>
              {registration.protocol} · Edição {registration.contest.year} ·{" "}
              {registration.category.name}
            </DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={registrationStatusTone(registration.status)}>
              {registrationStatusLabel(registration.status)}
            </StatusBadge>
            <StatusBadge tone={registration._count.photos >= 2 ? "success" : "warning"}>
              {registration._count.photos}/2 fotos
            </StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
          <div className="space-y-5">
            <DetailSection title="Responsável">
              <DetailGrid
                items={[
                  ["Nome", guardian.name],
                  ["E-mail", guardian.email],
                  ["Telefone", guardian.phone ?? "Não informado"],
                ]}
              />
            </DetailSection>

            <DetailSection title="Pagamento">
              {latestPayment ? (
                <>
                  <StatusBadge tone={paymentStatusTone(latestPayment.status)}>
                    {paymentStatusLabel(latestPayment.status)}
                  </StatusBadge>
                  <DetailGrid
                    className="mt-4"
                    items={[
                      ["Valor", formatCentsBRL(latestPayment.amountCents)],
                      ["Método", paymentMethodLabel(latestPayment.method)],
                      ["Vencimento", formatDateTime(latestPayment.dueDate)],
                      [
                        "Pago em",
                        latestPayment.paidAt ? formatDateTime(latestPayment.paidAt) : "Não pago",
                      ],
                    ]}
                  />
                </>
              ) : (
                <p className="text-sm text-ink-muted">Checkout ainda não iniciado.</p>
              )}
            </DetailSection>

            <DetailSection title="Linha do tempo">
              <DetailGrid
                items={[
                  ["Criada em", formatDateTime(registration.createdAt)],
                  ["Atualizada em", formatDateTime(registration.updatedAt)],
                  [
                    "Aprovada em",
                    registration.approvedAt
                      ? formatDateTime(registration.approvedAt)
                      : "Não aprovada",
                  ],
                  ["Motivo de recusa", registration.rejectionReason ?? "Nenhum"],
                ]}
              />
            </DetailSection>

            <DetailSection title="Revisão administrativa">
              <RegistrationReviewActions
                registrationId={registration.id}
                status={registration.status}
              />
            </DetailSection>
          </div>

          <DetailSection title="Fotos para conferência">
            {photos.length > 0 ? (
              <PhotoReview photos={photos} />
            ) : (
              <p className="text-sm text-ink-muted">Sem fotos.</p>
            )}
          </DetailSection>
        </div>

        <div className="mt-6 flex justify-end">
          <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
            Fechar
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

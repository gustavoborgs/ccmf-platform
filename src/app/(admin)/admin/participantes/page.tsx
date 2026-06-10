import { PhotoReview, type ReviewPhoto } from "@/modules/registrations/components/photo-review";
import { listContestFilterOptions } from "@/modules/contests/service";
import { listAdminParticipants } from "@/modules/participants/service";
import {
  ADMIN_REGISTRATION_STATUSES,
  adminParticipantFiltersSchema,
} from "@/modules/participants/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
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
  formatDate,
  formatDateTime,
  paymentStatusLabel,
  paymentStatusTone,
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminParticipantRow = Awaited<ReturnType<typeof listAdminParticipants>>["items"][number];

const columns: DataTableColumn<AdminParticipantRow>[] = [
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
        <StatusBadge tone={registrationStatusTone(registration.status)}>
          {registrationStatusLabel(registration.status)}
        </StatusBadge>
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
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (registration) => <ParticipantDetailsDialog registration={registration} />,
  },
];

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminParticipantFiltersSchema.parse(await searchParams);
  const [{ items: registrations, pagination }, contests] = await Promise.all([
    listAdminParticipants(filters),
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
      options: ADMIN_REGISTRATION_STATUSES.map((status) => ({
        value: status,
        label: registrationStatusLabel(status),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          Participantes
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Participantes inscritos</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Acompanhe crianças inscritas por edição, categoria e status. Esta visão é administrativa
          e inclui dados do responsável e status operacional da inscrição.
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
          emptyMessage="Nenhum participante encontrado para os filtros atuais."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function genderLabel(gender: string | null) {
  if (gender === "MALE") return "Masculino";
  if (gender === "FEMALE") return "Feminino";
  return "Gênero não informado";
}

function ParticipantDetailsDialog({ registration }: { registration: AdminParticipantRow }) {
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
            <DetailSection title="Dados da criança">
              <DetailGrid
                items={[
                  ["Nascimento", formatDate(registration.participant.birthDate)],
                  ["Gênero", genderLabel(registration.participant.gender)],
                  ["Cidade/UF", `${registration.participant.city}/${registration.participant.state}`],
                  [
                    "Consentimento de imagem",
                    registration.participant.imageConsentAt
                      ? formatDateTime(registration.participant.imageConsentAt)
                      : "Não registrado",
                  ],
                ]}
              />
            </DetailSection>

            <DetailSection title="Responsável">
              <DetailGrid
                items={[
                  ["Nome", guardian.name],
                  ["E-mail", guardian.email],
                  ["Telefone", guardian.phone ?? "Não informado"],
                ]}
              />
            </DetailSection>

            <DetailSection title="Operação">
              <div className="flex flex-wrap gap-2">
                {latestPayment ? (
                  <StatusBadge tone={paymentStatusTone(latestPayment.status)}>
                    {paymentStatusLabel(latestPayment.status)}
                  </StatusBadge>
                ) : (
                  <StatusBadge>Sem cobrança</StatusBadge>
                )}
                <StatusBadge tone="info">Likes: {registration.likesCount}</StatusBadge>
                <StatusBadge tone="info">Votos: {registration._count.votes}</StatusBadge>
              </div>
              <DetailGrid
                className="mt-4"
                items={[
                  ["Criada em", formatDateTime(registration.createdAt)],
                  ["Atualizada em", formatDateTime(registration.updatedAt)],
                  [
                    "Aprovada em",
                    registration.approvedAt ? formatDateTime(registration.approvedAt) : "Não aprovada",
                  ],
                  ["Motivo de recusa", registration.rejectionReason ?? "Nenhum"],
                ]}
              />
            </DetailSection>
          </div>

          <DetailSection title="Fotos enviadas">
            {photos.length > 0 ? <PhotoReview photos={photos} /> : <p className="text-sm text-ink-muted">Sem fotos.</p>}
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

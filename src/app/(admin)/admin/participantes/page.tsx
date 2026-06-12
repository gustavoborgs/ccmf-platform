import { listContestFilterOptions } from "@/modules/contests/service";
import { AdminParticipantDetailsDialog } from "@/modules/participants/components/admin-participant-details-dialog";
import { listAdminParticipants } from "@/modules/participants/service";
import {
  ADMIN_REGISTRATION_STATUSES,
  adminParticipantFiltersSchema,
} from "@/modules/participants/validators";
import {
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import {
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminParticipantRow = Awaited<ReturnType<typeof listAdminParticipants>>["items"][number];

const statusOptions = ADMIN_REGISTRATION_STATUSES.map((status) => ({
  value: status,
  label: registrationStatusLabel(status),
}));

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
    cell: (registration) => <AdminParticipantDetailsDialog registration={registration} />,
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
      options: statusOptions,
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

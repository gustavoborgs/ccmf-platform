import { listAdminContests } from "@/modules/contests/service";
import { contestStatusLabel, contestStatusTone } from "@/modules/contests/labels";
import { adminContestFiltersSchema, CONTEST_STATUSES } from "@/modules/contests/validators";
import {
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";
import { formatDateTime, StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminContestRow = Awaited<ReturnType<typeof listAdminContests>>["items"][number];

const columns: DataTableColumn<AdminContestRow>[] = [
  {
    id: "contest",
    header: "Edição",
    cell: (contest) => (
      <div>
        <p className="font-display text-lg font-extrabold text-primary-700">{contest.year}</p>
        <p className="text-ink-muted">{contest.name}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (contest) => (
      <StatusBadge tone={contestStatusTone(contest.status)}>
        {contestStatusLabel(contest.status)}
      </StatusBadge>
    ),
  },
  {
    id: "fee",
    header: "Taxa",
    cell: (contest) => (
      <span className="font-bold text-primary-700">
        {formatCentsBRL(contest.registrationFeeCents)}
      </span>
    ),
  },
  {
    id: "categories",
    header: "Categorias",
    cell: (contest) => contest._count.categories,
  },
  {
    id: "registrations",
    header: "Inscrições",
    cell: (contest) => contest._count.registrations,
  },
  {
    id: "revealAt",
    header: "Live de resultados",
    cell: (contest) =>
      contest.revealAt ? (
        formatDateTime(contest.revealAt)
      ) : (
        <span className="text-ink-muted">Não definida</span>
      ),
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-32",
    cellClassName: "text-right",
    cell: (contest) => (
      <Button href={`/admin/concursos/${contest.id}`} variant="outline" size="sm">
        Gerenciar
      </Button>
    ),
  },
];

export default async function AdminContestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminContestFiltersSchema.parse(await searchParams);
  const { items: contests, pagination } = await listAdminContests(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "status",
      label: "Status",
      options: CONTEST_STATUSES.map((status) => ({
        value: status,
        label: contestStatusLabel(status),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Concursos
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Edições do concurso</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Cada ano tem uma edição com suas próprias categorias (faixas etárias), taxa de
            inscrição, regulamento e moldura. Apenas uma edição pode estar com inscrições abertas
            por vez.
          </p>
        </div>
        <Button href="/admin/concursos/nova">Nova edição</Button>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Buscar por ano ou nome" filters={tableFilters} />
        <DataTable
          columns={columns}
          rows={contests}
          rowKey={(contest) => contest.id}
          emptyMessage="Nenhuma edição encontrada. Crie a primeira em “Nova edição”."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

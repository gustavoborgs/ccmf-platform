import { listAdminGuardians, type AdminGuardianListItem } from "@/modules/guardians/service";
import { adminGuardianFiltersSchema } from "@/modules/guardians/validators";
import {
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
} from "@/shared/ui";
import { StatusBadge } from "../_components/admin-ui";
import { GuardianDetailsDialog } from "./_components/guardian-details-dialog";

type SearchParams = Record<string, string | string[] | undefined>;

const columns: DataTableColumn<AdminGuardianListItem>[] = [
  {
    id: "guardian",
    header: "Responsável",
    cell: (guardian) => (
      <div>
        <p className="font-bold">{guardian.user.name}</p>
        <p className="text-ink-muted">{guardian.user.email}</p>
      </div>
    ),
  },
  {
    id: "contact",
    header: "Contato",
    cell: (guardian) => (
      <div>
        <p className="text-ink">{guardian.user.phone ?? "Sem telefone"}</p>
        <p className="text-ink-muted">WhatsApp: {guardian.whatsapp ?? "não informado"}</p>
      </div>
    ),
  },
  {
    id: "summary",
    header: "Participantes",
    cell: (guardian) => {
      return (
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">{guardian._count.participants} participantes</StatusBadge>
          <StatusBadge tone={guardian.paidRegistrationsCount > 0 ? "success" : "neutral"}>
            {guardian.paidRegistrationsCount} pagas
          </StatusBadge>
        </div>
      );
    },
  },
  {
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (guardian) => <GuardianDetailsDialog guardian={guardian} />,
  },
];

export default async function AdminGuardiansPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminGuardianFiltersSchema.parse(await searchParams);
  const { items: guardians, pagination } = await listAdminGuardians(filters);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          Responsáveis
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Base de responsáveis</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Consulte responsáveis cadastrados, seus contatos e o vínculo com participantes e
          inscrições pagas. A busca aceita nome, e-mail, CPF, telefone ou WhatsApp.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Nome, e-mail, CPF ou telefone" />
        <DataTable
          columns={columns}
          rows={guardians}
          rowKey={(guardian) => guardian.id}
          emptyMessage="Nenhum responsável encontrado para os filtros atuais."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

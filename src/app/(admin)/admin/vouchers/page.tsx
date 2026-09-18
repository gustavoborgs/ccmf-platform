import { listAdminVouchers } from "@/modules/vouchers/service";
import {
  adminVoucherFiltersSchema,
  VOUCHER_ACTIVE_FILTERS,
} from "@/modules/vouchers/validators";
import { formatCentsBRL } from "@/shared/utils";
import {
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import { formatDateTime, StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminVoucherRow = Awaited<ReturnType<typeof listAdminVouchers>>["items"][number];

const activeLabels: Record<(typeof VOUCHER_ACTIVE_FILTERS)[number], string> = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
};

const columns: DataTableColumn<AdminVoucherRow>[] = [
  {
    id: "code",
    header: "Código",
    cell: (voucher) => (
      <div>
        <p className="font-mono font-bold text-primary-800">{voucher.code}</p>
        {voucher.description && (
          <p className="max-w-xs truncate text-sm text-ink-muted">{voucher.description}</p>
        )}
      </div>
    ),
  },
  {
    id: "discount",
    header: "Desconto",
    cell: (voucher) => <p className="font-bold">{formatCentsBRL(voucher.discountCents)}</p>,
  },
  {
    id: "usage",
    header: "Usos",
    cell: (voucher) => {
      const limit = voucher.maxUses == null ? "∞" : String(voucher.maxUses);
      return (
        <div>
          <p className="font-bold">
            {voucher.confirmedCount} / {limit}
          </p>
          {voucher.reservedCount > 0 && (
            <p className="text-xs text-ink-muted">{voucher.reservedCount} reservado(s)</p>
          )}
        </div>
      );
    },
  },
  {
    id: "validity",
    header: "Validade",
    cell: (voucher) => {
      if (!voucher.startsAt && !voucher.endsAt) {
        return <span className="text-ink-muted">Sem prazo</span>;
      }
      return (
        <div className="whitespace-normal text-sm leading-snug">
          {voucher.startsAt && <p>De {formatDateTime(voucher.startsAt)}</p>}
          {voucher.endsAt && <p>Até {formatDateTime(voucher.endsAt)}</p>}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: (voucher) =>
      voucher.active ? (
        <StatusBadge tone="success">Ativo</StatusBadge>
      ) : (
        <StatusBadge tone="neutral">Inativo</StatusBadge>
      ),
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-32",
    cellClassName: "text-right",
    cell: (voucher) => (
      <Button href={`/admin/vouchers/${voucher.id}`} variant="outline" size="sm">
        Editar
      </Button>
    ),
  },
];

export default async function AdminVouchersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminVoucherFiltersSchema.parse(await searchParams);
  const { items, pagination } = await listAdminVouchers(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "active",
      label: "Status",
      options: VOUCHER_ACTIVE_FILTERS.filter((value) => value !== "all").map((value) => ({
        value,
        label: activeLabels[value],
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Operação
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Vouchers</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Crie cupons de desconto fixo para o checkout. Acompanhe usos confirmados e reservas de
            cobranças pendentes.
          </p>
        </div>
        <Button href="/admin/vouchers/novo" className="w-full sm:w-auto">
          Novo voucher
        </Button>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Buscar por código ou descrição" filters={tableFilters} />
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(voucher) => voucher.id}
          emptyMessage="Nenhum voucher encontrado. Crie o primeiro em “Novo voucher”."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

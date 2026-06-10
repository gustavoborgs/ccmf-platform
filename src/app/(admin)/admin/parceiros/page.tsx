import Image from "next/image";
import { listAdminPartners } from "@/modules/content/service";
import {
  adminPartnerFiltersSchema,
  PARTNER_TYPES,
  PARTNER_VISIBILITIES,
  type PartnerType,
} from "@/modules/content/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import {
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import { StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminPartnerRow = Awaited<ReturnType<typeof listAdminPartners>>["items"][number];

const partnerTypeLabels: Record<PartnerType, string> = {
  MASTER: "Parceiro master",
  MEDIA: "Veículo de comunicação",
  SPONSOR: "Patrocinador",
};

const visibilityLabels: Record<(typeof PARTNER_VISIBILITIES)[number], string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const columns: DataTableColumn<AdminPartnerRow>[] = [
  {
    id: "logo",
    header: "Logo",
    headClassName: "w-36",
    cell: (partner) =>
      partner.logoKey ? (
        <Image
          src={getPublicUrl(partner.logoKey)}
          alt=""
          width={120}
          height={60}
          className="aspect-[2/1] rounded-2xl border border-primary-100 bg-white object-contain p-2"
        />
      ) : (
        <div className="flex aspect-[2/1] w-[120px] items-center justify-center rounded-2xl bg-primary-50 font-display text-lg font-extrabold text-primary-200">
          Logo
        </div>
      ),
  },
  {
    id: "partner",
    header: "Parceiro",
    cell: (partner) => (
      <div>
        <p className="font-display text-lg font-extrabold text-primary-700">{partner.name}</p>
        <p className="max-w-xl truncate text-sm text-ink-muted">{partner.url ?? "Sem URL"}</p>
      </div>
    ),
  },
  {
    id: "type",
    header: "Tipo",
    cell: (partner) => partnerTypeLabels[partner.type],
  },
  {
    id: "status",
    header: "Status",
    cell: (partner) => (
      <StatusBadge tone={partner.active ? "success" : "neutral"}>
        {partner.active ? "Ativo" : "Inativo"}
      </StatusBadge>
    ),
  },
  {
    id: "order",
    header: "Ordem",
    cell: (partner) => partner.order,
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-32",
    cellClassName: "text-right",
    cell: (partner) => (
      <Button href={`/admin/parceiros/${partner.id}`} variant="outline" size="sm">
        Editar
      </Button>
    ),
  },
];

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminPartnerFiltersSchema.parse(await searchParams);
  const { items: partners, pagination } = await listAdminPartners(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "type",
      label: "Tipo",
      options: PARTNER_TYPES.map((type) => ({
        value: type,
        label: partnerTypeLabels[type],
      })),
    },
    {
      id: "visibility",
      label: "Visibilidade",
      options: PARTNER_VISIBILITIES.map((visibility) => ({
        value: visibility,
        label: visibilityLabels[visibility],
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Site
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Parceiros</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Gerencie parceiros master, veículos de comunicação e patrocinadores exibidos na home.
            Logos são recortados no padrão 800x400px antes do upload.
          </p>
        </div>
        <Button href="/admin/parceiros/novo">Novo parceiro</Button>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Buscar por nome ou URL" filters={tableFilters} />
        <DataTable
          columns={columns}
          rows={partners}
          rowKey={(partner) => partner.id}
          emptyMessage="Nenhum parceiro encontrado. Crie o primeiro em “Novo parceiro”."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

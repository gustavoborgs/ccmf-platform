import { getActiveContest } from "@/modules/contests/service";
import { listPreAccountLeads } from "@/modules/leads/service";
import { adminLeadFiltersSchema, CRM_STAGES, type CrmStage } from "@/modules/leads/validators";
import { getEnrollmentFunnel } from "@/modules/registrations/service";
import { resolvePagination } from "@/shared/list-params";
import {
  Button,
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
  StatusBadge,
} from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;

type CrmRow = {
  id: string;
  stage: CrmStage;
  title: string;
  subtitle: string;
  contact: string;
  protocol: string | null;
  photosLabel: string | null;
  updatedAt: Date;
  href: string;
};

const STAGE_LABELS: Record<CrmStage, string> = {
  PRE_ACCOUNT: "Pré-conta",
  PENDING_PHOTOS: "Fotos pendentes",
  READY_FOR_CHECKOUT: "Pronto p/ checkout",
  PAYMENT_PENDING: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Confirmada",
};

const STAGE_TONES: Record<CrmStage, Parameters<typeof StatusBadge>[0]["tone"]> = {
  PRE_ACCOUNT: "neutral",
  PENDING_PHOTOS: "warning",
  READY_FOR_CHECKOUT: "info",
  PAYMENT_PENDING: "warning",
  PAYMENT_CONFIRMED: "success",
};

const columns: DataTableColumn<CrmRow>[] = [
  {
    id: "lead",
    header: "Lead / participante",
    cell: (row) => (
      <div>
        <p className="font-bold">{row.title}</p>
        <p className="text-ink-muted">{row.subtitle}</p>
      </div>
    ),
  },
  {
    id: "stage",
    header: "Etapa",
    cell: (row) => <StatusBadge tone={STAGE_TONES[row.stage]}>{STAGE_LABELS[row.stage]}</StatusBadge>,
  },
  {
    id: "contact",
    header: "Contato",
    cell: (row) => <span className="text-ink-muted">{row.contact}</span>,
  },
  {
    id: "updatedAt",
    header: "Atualização",
    cell: (row) => (
      <span className="whitespace-nowrap text-ink-muted">{formatDateTime(row.updatedAt)}</span>
    ),
  },
  {
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (row) => <LeadDetailsDialog row={row} />,
  },
];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminLeadFiltersSchema.parse(await searchParams);
  const [preAccountLeads, contest] = await Promise.all([listPreAccountLeads(), getActiveContest()]);
  const funnel = contest ? await getEnrollmentFunnel(contest.id) : [];

  const allRows: CrmRow[] = [
    ...preAccountLeads.map((lead) => ({
      id: lead.id,
      stage: "PRE_ACCOUNT" as const,
      title: lead.name ?? "Responsável sem nome",
      subtitle: lead.source ? `Origem: ${lead.source}` : "Lead capturado no wizard",
      contact: lead.email ?? lead.phone ?? "Sem contato",
      protocol: null,
      photosLabel: null,
      updatedAt: lead.updatedAt,
      href: `/inscricao/retomar/${lead.id}`,
    })),
    ...funnel.map((item) => ({
      id: item.registrationId,
      stage: item.step,
      title: item.participantName,
      subtitle: `${item.guardian.name} · ${item.guardian.email}`,
      contact: item.guardian.phone ?? item.guardian.email,
      protocol: item.protocol,
      photosLabel: `${item.photosCount}/2 fotos`,
      updatedAt: item.updatedAt,
      href:
        item.step === "PAYMENT_CONFIRMED"
          ? "/admin/inscricoes"
          : `/inscricao/retomar/${item.protocol}`,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Fonte mesclada (Lead + funil derivado) → filtro e paginação em memória.
  const filtered = filterRows(allRows, filters.q, filters.stage);
  const { skip, ...pagination } = resolvePagination(
    filtered.length,
    filters.page,
    filters.pageSize,
  );
  const rows = filtered.slice(skip, skip + filters.pageSize);

  const tableFilters: DataTableFilter[] = [
    {
      id: "stage",
      label: "Etapa",
      options: CRM_STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] })),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          CRM de leads
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Gestão do funil</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          O pré-conta vem de `Lead`; as demais etapas são derivadas das inscrições.
          {contest ? ` Edição ativa: ${contest.name}.` : " Nenhuma edição ativa no momento."}
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar
          searchPlaceholder="Nome, e-mail, protocolo..."
          filters={tableFilters}
        />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyMessage="Nada encontrado. Ajuste a busca ou troque de etapa."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function filterRows(rows: CrmRow[], query: string | undefined, stage: CrmStage | undefined) {
  const normalizedQuery = query?.toLowerCase();
  return rows.filter((row) => {
    if (stage && row.stage !== stage) return false;
    if (!normalizedQuery) return true;
    return [row.title, row.subtitle, row.contact, row.protocol]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery));
  });
}

function LeadDetailsDialog({ row }: { row: CrmRow }) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DialogTitle>{row.title}</DialogTitle>
            <DialogDescription>{row.subtitle}</DialogDescription>
          </div>
          <StatusBadge tone={STAGE_TONES[row.stage]}>{STAGE_LABELS[row.stage]}</StatusBadge>
        </div>

        <div className="mt-6">
          <DetailSection title="Progresso">
            <DetailGrid
              items={[
                ["Contato", row.contact],
                ["Protocolo", row.protocol ?? "Ainda sem inscrição"],
                ["Fotos", row.photosLabel ?? "Não se aplica"],
                ["Atualização", formatDateTime(row.updatedAt)],
              ]}
            />
          </DetailSection>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
            Fechar
          </DialogClose>
          <Button href={row.href} size="sm">
            Abrir contexto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

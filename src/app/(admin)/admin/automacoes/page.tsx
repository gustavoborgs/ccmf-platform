import Link from "next/link";
import { listAdminAutomations, listAutomationLogs } from "@/modules/automations/service";
import { AUTOMATION_CHANNEL_LABELS, AUTOMATION_TYPE_LABELS } from "@/modules/automations/types";
import {
  adminAutomationLogFiltersSchema,
  AUTOMATION_STATUSES,
  AUTOMATION_TYPES,
} from "@/modules/automations/validators";
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
import { DetailGrid, DetailSection, formatDateTime, StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AutomationLogRow = Awaited<ReturnType<typeof listAutomationLogs>>["items"][number];
type AutomationRow = Awaited<ReturnType<typeof listAdminAutomations>>[number];

const automationColumns: DataTableColumn<AutomationRow>[] = [
  {
    id: "name",
    header: "Automação",
    cell: (automation) => (
      <div>
        <p className="font-bold">{automation.name}</p>
        <p className="text-ink-muted">
          {AUTOMATION_TYPE_LABELS[automation.type]} ·{" "}
          {AUTOMATION_CHANNEL_LABELS[automation.channel]}
        </p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (automation) => (
      <StatusBadge tone={automation.enabled ? "success" : "neutral"}>
        {automation.enabled ? "Ativa" : "Desligada"}
      </StatusBadge>
    ),
  },
  {
    id: "config",
    header: "Parâmetros",
    cell: (automation) =>
      automation.type === "REGISTRATION_RESUME_WHATSAPP" ? (
        <div className="text-sm text-ink-muted">
          <p>Atraso: {automation.config.delayHours}h</p>
          <p>Lote: {automation.config.batchLimit}</p>
        </div>
      ) : (
        <span className="text-ink-muted">—</span>
      ),
  },
  {
    id: "logs",
    header: "Disparos",
    cell: (automation) => (
      <span className="text-ink-muted">{automation._count.logs} registro(s)</span>
    ),
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-28",
    cellClassName: "text-right",
    cell: (automation) => (
      <Link
        href={`/admin/automacoes/${automation.id}`}
        className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50"
      >
        Configurar
      </Link>
    ),
  },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  SENT: "Enviado",
  FAILED: "Falhou",
  SKIPPED: "Ignorado",
};

const STATUS_TONES: Record<string, Parameters<typeof StatusBadge>[0]["tone"]> = {
  PENDING: "warning",
  SENT: "success",
  FAILED: "danger",
  SKIPPED: "neutral",
};

const columns: DataTableColumn<AutomationLogRow>[] = [
  {
    id: "automation",
    header: "Automação",
    cell: (log) => (
      <div>
        <p className="font-bold">{log.automation.name}</p>
        <p className="text-ink-muted">
          {AUTOMATION_CHANNEL_LABELS[log.automation.channel] ?? log.automation.channel}
        </p>
      </div>
    ),
  },
  {
    id: "recipient",
    header: "Destinatário",
    cell: (log) => (
      <div>
        <p className="font-bold">{log.recipientName}</p>
        <p className="text-ink-muted">{log.recipientPhone || "Telefone não informado"}</p>
      </div>
    ),
  },
  {
    id: "registration",
    header: "Inscrição",
    cell: (log) =>
      log.registration ? (
        <div>
          <p className="font-bold text-primary-700">{log.registration.protocol}</p>
          <p className="text-ink-muted">{log.registration.participant.name}</p>
        </div>
      ) : (
        <span className="text-ink-muted">Sem vínculo</span>
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: (log) => (
      <StatusBadge tone={STATUS_TONES[log.status] ?? "neutral"}>
        {STATUS_LABELS[log.status] ?? log.status}
      </StatusBadge>
    ),
  },
  {
    id: "sentAt",
    header: "Quando",
    cell: (log) => (
      <span className="whitespace-nowrap text-ink-muted">
        {log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}
      </span>
    ),
  },
  {
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (log) => <AutomationLogDetailsDialog log={log} />,
  },
];

export default async function AdminAutomationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminAutomationLogFiltersSchema.parse(await searchParams);
  const [automations, { items: logs, pagination }] = await Promise.all([
    listAdminAutomations(),
    listAutomationLogs(filters),
  ]);

  const tableFilters: DataTableFilter[] = [
    {
      id: "type",
      label: "Automação",
      options: AUTOMATION_TYPES.map((type) => ({
        value: type,
        label: AUTOMATION_TYPE_LABELS[type] ?? type,
      })),
    },
    {
      id: "status",
      label: "Status",
      options: AUTOMATION_STATUSES.map((status) => ({
        value: status,
        label: STATUS_LABELS[status] ?? status,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          Automações
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Automações</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Configure templates, cadências e limites de cada automação. Abaixo, acompanhe os
          disparos com destinatário, inscrição, horário e ids retornados pelo nevoa-manager.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-primary-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-primary-700">Automações configuradas</h2>
        </div>
        <DataTable
          columns={automationColumns}
          rows={automations}
          rowKey={(automation) => automation.id}
          emptyMessage="Nenhuma automação cadastrada."
        />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-primary-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-primary-700">Log de disparos</h2>
        </div>
        <DataTableToolbar
          searchPlaceholder="Responsável, participante, telefone ou protocolo"
          filters={tableFilters}
        />
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(log) => log.id}
          emptyMessage="Nenhum log encontrado para os filtros atuais."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function AutomationLogDetailsDialog({ log }: { log: AutomationLogRow }) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DialogTitle>{log.automation.name}</DialogTitle>
            <DialogDescription>
              {AUTOMATION_TYPE_LABELS[log.automation.type]} ·{" "}
              {log.registration
                ? `${log.registration.protocol} · ${log.registration.participant.name}`
                : "Registro sem inscrição vinculada"}
            </DialogDescription>
          </div>
          <StatusBadge tone={STATUS_TONES[log.status] ?? "neutral"}>
            {STATUS_LABELS[log.status] ?? log.status}
          </StatusBadge>
        </div>

        <div className="mt-6 space-y-5">
          <DetailSection title="Destinatário">
            <DetailGrid
              items={[
                ["Nome", log.recipientName],
                ["Telefone", log.recipientPhone || "Não informado"],
                ["Responsável", log.registration?.participant.guardian.user.name ?? "-"],
                ["E-mail", log.registration?.participant.guardian.user.email ?? "-"],
              ]}
            />
          </DetailSection>

          <DetailSection title="Execução">
            <DetailGrid
              items={[
                ["Criado em", formatDateTime(log.createdAt)],
                ["Agendado para", formatDateTime(log.scheduledFor)],
                ["Enviado em", formatDateTime(log.sentAt)],
                ["Batch externo", log.externalBatchId ?? "-"],
                ["Job externo", log.externalJobId ?? "-"],
                ["Erro", log.error ?? "-"],
              ]}
            />
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

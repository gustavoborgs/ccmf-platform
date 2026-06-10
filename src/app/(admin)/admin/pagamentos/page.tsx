import { listAdminPayments } from "@/modules/payments/service";
import {
  ADMIN_PAYMENT_METHODS,
  ADMIN_PAYMENT_STATUSES,
  adminPaymentFiltersSchema,
} from "@/modules/payments/validators";
import { formatCentsBRL } from "@/shared/utils";
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
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminPaymentRow = Awaited<ReturnType<typeof listAdminPayments>>["items"][number];

const columns: DataTableColumn<AdminPaymentRow>[] = [
  {
    id: "payment",
    header: "Cobrança",
    cell: (payment) => (
      <div className="space-y-2">
        <StatusBadge tone={paymentStatusTone(payment.status)}>
          {paymentStatusLabel(payment.status)}
        </StatusBadge>
        <p className="font-bold">{formatCentsBRL(payment.amountCents)}</p>
        <p className="text-ink-muted">{paymentMethodLabel(payment.method)}</p>
      </div>
    ),
  },
  {
    id: "registration",
    header: "Inscrição",
    cell: (payment) => (
      <div>
        <p className="font-bold">{payment.registration.participant.name}</p>
        <p className="text-ink-muted">
          {payment.registration.protocol} · Edição {payment.registration.contest.year}
        </p>
      </div>
    ),
  },
  {
    id: "guardian",
    header: "Responsável",
    cell: (payment) => {
      const guardian = payment.registration.participant.guardian.user;
      return (
        <div>
          <p className="font-bold">{guardian.name}</p>
          <p className="text-ink-muted">{guardian.email}</p>
        </div>
      );
    },
  },
  {
    id: "dueDate",
    header: "Vencimento",
    cell: (payment) => (
      <span className="whitespace-nowrap text-ink-muted">{formatDateTime(payment.dueDate)}</span>
    ),
  },
  {
    id: "details",
    header: "",
    headClassName: "w-24",
    cellClassName: "text-right",
    cell: (payment) => <PaymentDetailsDialog payment={payment} />,
  },
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminPaymentFiltersSchema.parse(await searchParams);
  const { items: payments, pagination } = await listAdminPayments(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "status",
      label: "Status",
      options: ADMIN_PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: paymentStatusLabel(status),
      })),
    },
    {
      id: "method",
      label: "Método",
      options: ADMIN_PAYMENT_METHODS.map((method) => ({
        value: method,
        label: paymentMethodLabel(method),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          Pagamentos
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Cobranças Asaas</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          A confirmação da inscrição depende do webhook ou da conciliação server-side. Esta tela
          mostra o status local espelhado do Asaas; uma inscrição pode ter mais de uma cobrança.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar
          searchPlaceholder="Participante, protocolo, responsável ou id Asaas"
          filters={tableFilters}
        />
        <DataTable
          columns={columns}
          rows={payments}
          rowKey={(payment) => payment.id}
          emptyMessage="Nenhuma cobrança encontrada para os filtros atuais."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function PaymentDetailsDialog({ payment }: { payment: AdminPaymentRow }) {
  const registration = payment.registration;
  const guardian = registration.participant.guardian.user;

  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DialogTitle>{registration.participant.name}</DialogTitle>
            <DialogDescription>
              {registration.protocol} · Edição {registration.contest.year} ·{" "}
              {registration.category.name}
            </DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={paymentStatusTone(payment.status)}>
              {paymentStatusLabel(payment.status)}
            </StatusBadge>
            <StatusBadge tone={registrationStatusTone(registration.status)}>
              {registrationStatusLabel(registration.status)}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <DetailSection title="Cobrança">
            <DetailGrid
              items={[
                ["Valor", formatCentsBRL(payment.amountCents)],
                ["Método", paymentMethodLabel(payment.method)],
                ["Vencimento", formatDateTime(payment.dueDate)],
                ["Pago em", payment.paidAt ? formatDateTime(payment.paidAt) : "Não pago"],
                ["Criada em", formatDateTime(payment.createdAt)],
                ["Id Asaas", payment.asaasPaymentId ?? "Não sincronizado"],
              ]}
            />
            {(payment.invoiceUrl || payment.boletoUrl) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {payment.invoiceUrl && (
                  <Button
                    href={payment.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="sm"
                  >
                    Abrir invoice
                  </Button>
                )}
                {payment.boletoUrl && (
                  <Button
                    href={payment.boletoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="sm"
                  >
                    Abrir boleto
                  </Button>
                )}
              </div>
            )}
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

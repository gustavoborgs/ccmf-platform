import { listAdminGuardians, type AdminGuardianListItem } from "@/modules/guardians/service";
import { adminGuardianFiltersSchema } from "@/modules/guardians/validators";
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
} from "@/shared/ui";
import { DetailGrid, DetailSection, formatDateTime, StatusBadge } from "../_components/admin-ui";

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

function GuardianDetailsDialog({ guardian }: { guardian: AdminGuardianListItem }) {
  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <DialogTitle>{guardian.user.name}</DialogTitle>
            <DialogDescription>{guardian.user.email}</DialogDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={guardian.asaasCustomerId ? "success" : "neutral"}>
              {guardian.asaasCustomerId ? "Asaas vinculado" : "Asaas não criado"}
            </StatusBadge>
            <StatusBadge tone="info">{guardian._count.participants} participantes</StatusBadge>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <DetailSection title="Dados cadastrais">
            <DetailGrid
              items={[
                ["Nome", guardian.user.name],
                ["E-mail", guardian.user.email],
                ["Telefone", guardian.user.phone ?? "Não informado"],
                ["WhatsApp", guardian.whatsapp ?? "Não informado"],
                ["CPF", guardian.cpf ?? "Não informado"],
                ["Cadastro", formatDateTime(guardian.user.createdAt)],
              ]}
            />
          </DetailSection>

          <DetailSection title="Endereço">
            <DetailGrid
              items={[
                ["CEP", guardian.zipCode ?? "Não informado"],
                ["Cidade/UF", guardian.city && guardian.state ? `${guardian.city}/${guardian.state}` : "Não informado"],
                ["Bairro", guardian.neighborhood ?? "Não informado"],
                ["Logradouro", formatAddressLine(guardian)],
                ["Complemento", guardian.complement ?? "Nenhum"],
              ]}
            />
          </DetailSection>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <DetailSection title="Pagamentos e integração">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={guardian.paidRegistrationsCount > 0 ? "success" : "neutral"}>
                {guardian.paidRegistrationsCount} inscrições pagas
              </StatusBadge>
              <StatusBadge tone={guardian.asaasCustomerId ? "success" : "neutral"}>
                {guardian.asaasCustomerId ? "Customer criado" : "Sem customer"}
              </StatusBadge>
            </div>
            <DetailGrid
              className="mt-4"
              items={[["Asaas customer", guardian.asaasCustomerId ?? "Não criado"]]}
            />
          </DetailSection>

          <DetailSection title="Participantes vinculados">
            {guardian.participants.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum participante cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {guardian.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-xl border border-primary-100 bg-white px-3 py-2"
                  >
                    <p className="font-bold text-ink">{participant.name}</p>
                    <p className="text-sm text-ink-muted">
                      {participant.city}/{participant.state} · {participant._count.registrations} inscrições ·{" "}
                      {participant.registrations.length} pagas
                    </p>
                  </div>
                ))}
              </div>
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

function formatAddressLine(guardian: AdminGuardianListItem) {
  if (!guardian.street) return "Não informado";
  return [guardian.street, guardian.number].filter(Boolean).join(", ");
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { AdminGuardianListItem } from "@/modules/guardians/service";
import { updateAdminGuardianAction } from "@/modules/guardians/actions";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  TextInput,
  cn,
} from "@/shared/ui";
import { DetailGrid, DetailSection, formatDateTime, StatusBadge } from "../../_components/admin-ui";

type Mode = "details" | "edit";

type GuardianFormState = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  whatsapp: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  newPassword: string;
  confirmPassword: string;
};

export function GuardianDetailsDialog({ guardian }: { guardian: AdminGuardianListItem }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("details");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<GuardianFormState>(() => initialFormState(guardian));

  function updateField(field: keyof GuardianFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openEditMode() {
    setError(null);
    setSuccess(false);
    setMode("edit");
  }

  function cancelEdit() {
    setForm(initialFormState(guardian));
    setError(null);
    setSuccess(false);
    setMode("details");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateAdminGuardianAction(guardian.id, form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setForm((current) => ({ ...current, newPassword: "", confirmPassword: "" }));
      setSuccess(true);
      setMode("details");
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger className="rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
        Detalhes
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-5xl overflow-hidden p-0">
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col">
          <header className="border-b border-primary-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

            <div className="mt-4 grid grid-cols-2 rounded-full bg-primary-50 p-1 sm:inline-grid">
              <ModeButton active={mode === "details"} onClick={() => setMode("details")}>
                Visão geral
              </ModeButton>
              <ModeButton active={mode === "edit"} onClick={openEditMode}>
                Editar dados
              </ModeButton>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {mode === "details" ? (
              <GuardianDetailsView guardian={guardian} onEdit={openEditMode} success={success} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <section className="rounded-bubble border border-primary-100 bg-primary-50/30 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-primary-700">
                        Dados do responsável
                      </h3>
                      <p className="text-sm text-ink-muted">
                        Corrija contatos, endereço e defina uma nova senha quando necessário.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Nome completo">
                      <TextInput
                        required
                        value={form.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        disabled={isPending}
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="E-mail">
                      <TextInput
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        disabled={isPending}
                        autoComplete="email"
                      />
                    </Field>
                    <Field label="Telefone">
                      <TextInput
                        type="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        disabled={isPending}
                        placeholder="(11) 99999-9999"
                        autoComplete="tel"
                      />
                    </Field>
                    <Field label="WhatsApp">
                      <TextInput
                        type="tel"
                        value={form.whatsapp}
                        onChange={(event) => updateField("whatsapp", event.target.value)}
                        disabled={isPending}
                        placeholder="(11) 99999-9999"
                      />
                    </Field>
                    <Field label="CPF">
                      <TextInput
                        value={form.cpf}
                        onChange={(event) => updateField("cpf", event.target.value)}
                        disabled={isPending}
                        placeholder="000.000.000-00"
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-bubble border border-primary-100 bg-white p-4 shadow-brand">
                  <h3 className="font-display text-lg font-extrabold text-primary-700">Endereço</h3>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Field label="CEP" className="lg:col-span-2">
                      <TextInput
                        value={form.zipCode}
                        onChange={(event) => updateField("zipCode", event.target.value)}
                        disabled={isPending}
                        placeholder="00000-000"
                        autoComplete="postal-code"
                      />
                    </Field>
                    <Field label="Cidade" className="lg:col-span-3">
                      <TextInput
                        value={form.city}
                        onChange={(event) => updateField("city", event.target.value)}
                        disabled={isPending}
                        autoComplete="address-level2"
                      />
                    </Field>
                    <Field label="UF" className="lg:col-span-1">
                      <TextInput
                        value={form.state}
                        onChange={(event) => updateField("state", event.target.value.toUpperCase())}
                        disabled={isPending}
                        maxLength={2}
                        autoComplete="address-level1"
                      />
                    </Field>
                    <Field label="Logradouro" className="lg:col-span-4">
                      <TextInput
                        value={form.street}
                        onChange={(event) => updateField("street", event.target.value)}
                        disabled={isPending}
                        autoComplete="address-line1"
                      />
                    </Field>
                    <Field label="Número" className="lg:col-span-2">
                      <TextInput
                        value={form.number}
                        onChange={(event) => updateField("number", event.target.value)}
                        disabled={isPending}
                        autoComplete="address-line2"
                      />
                    </Field>
                    <Field label="Bairro" className="lg:col-span-3">
                      <TextInput
                        value={form.neighborhood}
                        onChange={(event) => updateField("neighborhood", event.target.value)}
                        disabled={isPending}
                      />
                    </Field>
                    <Field label="Complemento" className="lg:col-span-3">
                      <TextInput
                        value={form.complement}
                        onChange={(event) => updateField("complement", event.target.value)}
                        disabled={isPending}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-bubble border border-accent-100 bg-accent-50/50 p-4">
                  <h3 className="font-display text-lg font-extrabold text-primary-700">
                    Criar nova senha
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Preencha apenas se quiser substituir a senha atual do responsável.
                  </p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
                      <TextInput
                        type="password"
                        value={form.newPassword}
                        onChange={(event) => updateField("newPassword", event.target.value)}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Confirmar nova senha">
                      <TextInput
                        type="password"
                        value={form.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                    </Field>
                  </div>
                </section>

                {error && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Responsável atualizado com sucesso.
                  </p>
                )}

                <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-primary-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuardianDetailsView({
  guardian,
  onEdit,
  success,
}: {
  guardian: AdminGuardianListItem;
  onEdit: () => void;
  success: boolean;
}) {
  return (
    <div className="space-y-5">
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Responsável atualizado com sucesso.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-bubble bg-brand-gradient p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-white/75">
            Cadastro administrativo
          </p>
          <h3 className="mt-1 text-2xl font-extrabold">Detalhes do responsável</h3>
          <p className="mt-1 text-sm text-white/85">
            Consulte os dados atuais ou abra o formulário para corrigir informações.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onEdit}
          className="w-full bg-white text-accent-700 hover:bg-accent-50 sm:w-auto"
        >
          Editar dados
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
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
              [
                "Cidade/UF",
                guardian.city && guardian.state ? `${guardian.city}/${guardian.state}` : "Não informado",
              ],
              ["Bairro", guardian.neighborhood ?? "Não informado"],
              ["Logradouro", formatAddressLine(guardian)],
              ["Complemento", guardian.complement ?? "Nenhum"],
            ]}
          />
        </DetailSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
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

      <div className="flex justify-end">
        <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
          Fechar
        </DialogClose>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-extrabold transition",
        active ? "bg-white text-accent-700 shadow-brand" : "text-primary-700 hover:bg-white/70",
      )}
    >
      {children}
    </button>
  );
}

function initialFormState(guardian: AdminGuardianListItem): GuardianFormState {
  return {
    name: guardian.user.name,
    email: guardian.user.email,
    phone: guardian.user.phone ?? "",
    cpf: guardian.cpf ?? "",
    whatsapp: guardian.whatsapp ?? "",
    zipCode: guardian.zipCode ?? "",
    street: guardian.street ?? "",
    number: guardian.number ?? "",
    complement: guardian.complement ?? "",
    neighborhood: guardian.neighborhood ?? "",
    city: guardian.city ?? "",
    state: guardian.state ?? "",
    newPassword: "",
    confirmPassword: "",
  };
}

function formatAddressLine(guardian: AdminGuardianListItem) {
  if (!guardian.street) return "Não informado";
  return [guardian.street, guardian.number].filter(Boolean).join(", ");
}

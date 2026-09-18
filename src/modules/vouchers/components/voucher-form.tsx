"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";
import { createVoucherAction, updateVoucherAction } from "../actions";

export type VoucherFormInitial = {
  id: string;
  code: string;
  description: string | null;
  discountCents: number;
  maxUses: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  confirmedCount: number;
  reservedCount: number;
  hasAnyRedemption: boolean;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function parseDateInput(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Converte string de reais (ex.: "10,50" ou "10.50") em centavos. */
function reaisToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const reais = Number(normalized);
  if (!Number.isFinite(reais) || reais <= 0) return null;
  return Math.round(reais * 100);
}

export function VoucherForm({ initial }: { initial?: VoucherFormInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const codeDiscountLocked = Boolean(initial?.hasAnyRedemption);

  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [discountReais, setDiscountReais] = useState(
    initial ? (initial.discountCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [unlimited, setUnlimited] = useState(initial ? initial.maxUses == null : true);
  const [maxUses, setMaxUses] = useState(initial?.maxUses != null ? String(initial.maxUses) : "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInputValue(initial?.endsAt ?? null));
  const [active, setActive] = useState(initial?.active ?? true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const discountCents = reaisToCents(discountReais);
    if (discountCents == null) {
      setError("Informe um desconto válido em reais (ex.: 10,00).");
      return;
    }

    const parsedMaxUses = unlimited ? null : Number(maxUses);
    if (!unlimited && (!Number.isInteger(parsedMaxUses) || (parsedMaxUses ?? 0) < 1)) {
      setError("Informe um limite de usos válido ou marque como ilimitado.");
      return;
    }

    const payload = {
      code,
      description: description.trim() || null,
      discountCents,
      unlimited,
      maxUses: unlimited ? null : parsedMaxUses,
      startsAt: parseDateInput(startsAt),
      endsAt: parseDateInput(endsAt),
      active,
    };

    startTransition(async () => {
      if (!initial) {
        const result = await createVoucherAction(payload);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/admin/vouchers/${result.data.voucherId}`);
        return;
      }

      const result = await updateVoucherAction(initial.id, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <Field label="Código" hint="Letras, números, hífen ou underscore. Será salvo em maiúsculas.">
          <TextInput
            required
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            disabled={isPending || codeDiscountLocked}
            placeholder="EX: BEMVINDO10"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-wide"
          />
        </Field>

        <Field label="Descrição" hint="Opcional. Visível só no admin.">
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isPending}
            placeholder="Campanha de lançamento"
          />
        </Field>

        <Field
          label="Desconto (R$)"
          hint={initial ? `Atual: ${formatCentsBRL(initial.discountCents)}` : undefined}
        >
          <TextInput
            required
            value={discountReais}
            onChange={(event) => setDiscountReais(event.target.value)}
            disabled={isPending || codeDiscountLocked}
            placeholder="10,00"
            inputMode="decimal"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(event) => setUnlimited(event.target.checked)}
            disabled={isPending}
            className="h-5 w-5 rounded border-primary-300 text-accent-600"
          />
          <span>
            <span className="block text-sm font-bold text-ink">Ilimitado</span>
            <span className="block text-xs text-ink-muted">
              Sem teto de usos. Desmarque para definir um limite.
            </span>
          </span>
        </label>

        {!unlimited && (
          <Field label="Limite de usos">
            <TextInput
              required
              type="number"
              min={1}
              step={1}
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              disabled={isPending}
            />
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Válido a partir de" hint="Opcional">
            <TextInput
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              disabled={isPending}
              className="min-w-0 text-sm"
            />
          </Field>
          <Field label="Válido até" hint="Opcional">
            <TextInput
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              disabled={isPending}
              className="min-w-0 text-sm"
            />
          </Field>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <label className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/40 px-4 py-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            disabled={isPending}
            className="h-5 w-5 rounded border-primary-300 text-accent-600"
          />
          <span>
            <span className="block text-sm font-bold text-ink">Ativo</span>
            <span className="block text-xs text-ink-muted">
              Cupons inativos não podem ser aplicados no checkout.
            </span>
          </span>
        </label>

        {initial && (
          <div className="rounded-bubble border border-primary-100 bg-white p-4 shadow-brand">
            <p className="font-display text-sm font-extrabold text-primary-800">Utilização</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-primary-50 px-2 py-3">
                <p className="font-display text-xl font-extrabold text-primary-700">
                  {initial.confirmedCount}
                </p>
                <p className="text-xs text-ink-muted">Confirmados</p>
              </div>
              <div className="rounded-2xl bg-primary-50 px-2 py-3">
                <p className="font-display text-xl font-extrabold text-primary-700">
                  {initial.reservedCount}
                </p>
                <p className="text-xs text-ink-muted">Reservados</p>
              </div>
            </div>
            {codeDiscountLocked && (
              <p className="mt-3 text-xs text-ink-muted">
                Código e desconto estão bloqueados porque este voucher já teve uso.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Voucher salvo com sucesso.
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Salvando..." : initial ? "Salvar alterações" : "Criar voucher"}
        </Button>
      </aside>
    </form>
  );
}

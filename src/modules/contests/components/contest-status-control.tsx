"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, SelectInput } from "@/shared/ui";
import { updateContestStatusAction } from "../actions";
import { CONTEST_STATUS_HINTS, CONTEST_STATUS_LABELS } from "../labels";
import { CONTEST_STATUSES, type ContestStatusValue } from "../validators";

/**
 * Controle da máquina de estados da edição:
 * DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → JUDGING → RESULTS_PUBLISHED → ARCHIVED.
 * O service garante que só uma edição fica com inscrições abertas por vez.
 */
export function ContestStatusControl({
  contestId,
  status,
}: {
  contestId: string;
  status: ContestStatusValue;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<ContestStatusValue>(status);
  const [error, setError] = useState<string | null>(null);

  function handleApply() {
    setError(null);
    startTransition(async () => {
      const result = await updateContestStatusAction({ contestId, status: selected });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-60 flex-1">
          <span className="mb-1.5 block text-sm font-bold text-ink">Status da edição</span>
          <SelectInput
            value={selected}
            onChange={(event) => setSelected(event.target.value as ContestStatusValue)}
            disabled={isPending}
          >
            {CONTEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CONTEST_STATUS_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </label>
        <Button
          type="button"
          variant="secondary"
          onClick={handleApply}
          disabled={isPending || selected === status}
        >
          {isPending ? "Atualizando..." : "Atualizar status"}
        </Button>
      </div>

      <p className="text-sm text-ink-muted">{CONTEST_STATUS_HINTS[selected]}</p>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
      )}
    </div>
  );
}

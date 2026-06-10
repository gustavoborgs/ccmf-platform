"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveRegistrationAction,
  rejectRegistrationAction,
} from "@/modules/registrations/actions";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui";

type ReviewableStatus = "PAID" | "UNDER_REVIEW";

export function RegistrationReviewActions({
  registrationId,
  status,
}: {
  registrationId: string;
  status: string;
}) {
  const isReviewable = status === "PAID" || status === "UNDER_REVIEW";

  if (!isReviewable) {
    return (
      <p className="text-sm text-ink-muted">
        Esta inscrição não está na etapa de revisão administrativa.
      </p>
    );
  }

  return <ReviewControls registrationId={registrationId} status={status} />;
}

function ReviewControls({
  registrationId,
  status,
}: {
  registrationId: string;
  status: ReviewableStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveRegistrationAction({ registrationId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectRegistrationAction({
        registrationId,
        rejectionReason: reason,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRejectOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        {status === "PAID"
          ? "Pagamento confirmado. Ao aprovar, a inscrição será publicada na galeria."
          : "Confira as fotos e aprove ou recuse a inscrição."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleApprove} disabled={isPending}>
          {isPending ? "Processando..." : "Aprovar inscrição"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRejectOpen(true);
          }}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-full border-2 border-red-600 px-4 font-display text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
        >
          Recusar
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle>Recusar inscrição</DialogTitle>
          <DialogDescription>
            Informe o motivo da recusa. Ele ficará registrado na inscrição.
          </DialogDescription>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">Motivo</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={5}
                minLength={10}
                maxLength={500}
                className="w-full rounded-2xl border border-primary-200 bg-white px-4 py-3 text-ink placeholder:text-ink-muted/60 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-60"
                placeholder="Ex.: Foto fora do padrão do regulamento."
              />
            </label>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
                Cancelar
              </DialogClose>
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || reason.trim().length < 10}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
              >
                {isPending ? "Recusando..." : "Confirmar recusa"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

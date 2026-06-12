"use client";

import { useState, useTransition, type ReactNode } from "react";
import { getAdminParticipantRegistrationAction } from "@/modules/participants/actions";
import type { AdminParticipantRegistration } from "@/modules/participants/service";
import { AdminParticipantDetailsContent } from "@/modules/participants/components/admin-participant-details-dialog";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/shared/ui";

type AdminParticipantRegistrationViewDialogProps = {
  registrationId: string;
  trigger?: ReactNode;
  triggerClassName?: string;
};

export function AdminParticipantRegistrationViewDialog({
  registrationId,
  trigger = "Ver",
  triggerClassName = "shrink-0 rounded-full border border-primary-100 px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-50",
}: AdminParticipantRegistrationViewDialogProps) {
  const [registration, setRegistration] = useState<AdminParticipantRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(open: boolean) {
    if (!open) return;
    if (registration || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await getAdminParticipantRegistrationAction({ registrationId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRegistration(result.data);
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent className="z-[60] max-w-3xl">
        {isPending ? (
          <p className="text-sm text-ink-muted">Carregando detalhes do participante...</p>
        ) : error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : registration ? (
          <AdminParticipantDetailsContent registration={registration} />
        ) : null}

        <div className="mt-6 flex justify-end">
          <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
            Fechar
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

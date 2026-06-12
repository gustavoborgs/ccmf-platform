"use client";

import { type ReactNode } from "react";
import {
  AdminParticipantPhotoManager,
  AdminParticipantStatusControl,
} from "@/modules/participants/components/admin-participant-controls";
import type { AdminParticipantRegistration } from "@/modules/participants/service";
import { ADMIN_REGISTRATION_STATUSES } from "@/modules/participants/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui";
import {
  DetailGrid,
  DetailSection,
  formatDate,
  formatDateTime,
  paymentStatusLabel,
  paymentStatusTone,
  registrationStatusLabel,
  registrationStatusTone,
  StatusBadge,
} from "@/app/(admin)/admin/_components/admin-ui";

const statusOptions = ADMIN_REGISTRATION_STATUSES.map((status) => ({
  value: status,
  label: registrationStatusLabel(status),
}));

function genderLabel(gender: string | null) {
  if (gender === "MALE") return "Masculino";
  if (gender === "FEMALE") return "Feminino";
  return "Gênero não informado";
}

type AdminParticipantDetailsDialogProps = {
  registration: AdminParticipantRegistration;
  trigger?: ReactNode;
  triggerClassName?: string;
};

export function AdminParticipantDetailsDialog({
  registration,
  trigger = "Detalhes",
  triggerClassName = "rounded-full border border-primary-100 px-4 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50",
}: AdminParticipantDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>
      <DialogContent className="z-[60] max-w-3xl">
        <AdminParticipantDetailsContent registration={registration} />

        <div className="mt-6 flex justify-end">
          <DialogClose className="rounded-full px-5 py-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
            Fechar
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminParticipantDetailsContent({
  registration,
}: {
  registration: AdminParticipantRegistration;
}) {
  const guardian = registration.participant.guardian.user;
  const latestPayment = registration.payments[0];
  const photos = registration.photos.map((photo) => ({
    id: photo.id,
    url: getPublicUrl(photo.storageKey),
    order: photo.order,
    isCover: photo.isCover,
    width: photo.width,
    height: photo.height,
  }));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <DialogTitle>{registration.participant.name}</DialogTitle>
          <DialogDescription>
            {registration.protocol} · Edição {registration.contest.year} ·{" "}
            {registration.category.name}
          </DialogDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={registrationStatusTone(registration.status)}>
            {registrationStatusLabel(registration.status)}
          </StatusBadge>
          <StatusBadge tone={registration._count.photos >= 2 ? "success" : "warning"}>
            {registration._count.photos}/2 fotos
          </StatusBadge>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="space-y-5">
          <DetailSection title="Dados da criança">
            <DetailGrid
              items={[
                ["Nascimento", formatDate(registration.participant.birthDate)],
                ["Gênero", genderLabel(registration.participant.gender)],
                ["Cidade/UF", `${registration.participant.city}/${registration.participant.state}`],
                [
                  "Consentimento de imagem",
                  registration.participant.imageConsentAt
                    ? formatDateTime(registration.participant.imageConsentAt)
                    : "Não registrado",
                ],
              ]}
            />
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

          <DetailSection title="Operação">
            <div className="flex flex-wrap gap-2">
              {latestPayment ? (
                <StatusBadge tone={paymentStatusTone(latestPayment.status)}>
                  {paymentStatusLabel(latestPayment.status)}
                </StatusBadge>
              ) : (
                <StatusBadge>Sem cobrança</StatusBadge>
              )}
              <StatusBadge tone="info">Likes: {registration.likesCount}</StatusBadge>
              <StatusBadge tone="info">Votos: {registration._count.votes}</StatusBadge>
            </div>
            <div className="mt-4">
              <AdminParticipantStatusControl
                registrationId={registration.id}
                currentStatus={registration.status}
                options={statusOptions}
              />
            </div>
            <DetailGrid
              className="mt-4"
              items={[
                ["Criada em", formatDateTime(registration.createdAt)],
                ["Atualizada em", formatDateTime(registration.updatedAt)],
                [
                  "Aprovada em",
                  registration.approvedAt ? formatDateTime(registration.approvedAt) : "Não aprovada",
                ],
                ["Motivo de recusa", registration.rejectionReason ?? "Nenhum"],
              ]}
            />
          </DetailSection>
        </div>

        <DetailSection title="Fotos enviadas">
          <AdminParticipantPhotoManager registrationId={registration.id} photos={photos} />
        </DetailSection>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import type { ReferralStats } from "@/modules/referrals/types";
import { registrationStatusLabel, registrationStatusTone, StatusBadge } from "@/app/(admin)/admin/_components/admin-ui";
import { Button } from "@/shared/ui/button";

type AdminParticipantReferralSectionProps = {
  incomingReferral: {
    referrerName: string;
    referrerCode: string;
    campaignName: string;
    rewardGranted: boolean;
  } | null;
  referralStats: ReferralStats | null;
};

export function AdminParticipantReferralSection({
  incomingReferral,
  referralStats,
}: AdminParticipantReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  if (!referralStats && !incomingReferral) {
    return (
      <p className="text-sm text-ink-muted">Nenhuma indicação vinculada a esta inscrição.</p>
    );
  }

  async function copyShareUrl() {
    if (!referralStats?.shareUrl) return;
    await navigator.clipboard.writeText(referralStats.shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {incomingReferral && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4 text-sm">
          <p className="font-bold text-primary-800">Veio por indicação</p>
          <p className="mt-1 text-ink-muted">
            Indicado por <strong>{incomingReferral.referrerName}</strong> (código{" "}
            {incomingReferral.referrerCode}) · campanha {incomingReferral.campaignName}
          </p>
          <p className="mt-2 text-ink-muted">
            Prêmio ao indicador:{" "}
            {incomingReferral.rewardGranted ? "já concedido" : "pendente (após aprovação)"}
          </p>
        </div>
      )}

      {referralStats && (
        <>
          <div className="rounded-2xl border border-primary-100 p-4">
            <p className="text-sm font-bold text-primary-800">Código deste participante</p>
            <p className="mt-1 font-mono text-lg font-extrabold tracking-widest text-primary-700">
              {referralStats.referralCode}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={copyShareUrl}>
                {copied ? "Link copiado!" : "Copiar link"}
              </Button>
            </div>
            <p className="mt-2 break-all text-xs text-ink-muted">{referralStats.shareUrl}</p>
          </div>

          <div>
            <p className="text-sm font-bold text-primary-800">
              Indicações feitas ({referralStats.referralsCount})
            </p>
            {referralStats.referrals.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Ainda não indicou ninguém nesta edição.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {referralStats.referrals.map((referral) => (
                  <li
                    key={referral.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold">{referral.participantName}</p>
                      <p className="text-ink-muted">{referral.protocol}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={registrationStatusTone(referral.status)}>
                        {registrationStatusLabel(referral.status)}
                      </StatusBadge>
                      <StatusBadge tone={referral.rewardGranted ? "success" : "neutral"}>
                        {referral.rewardGranted ? "Prêmio pago" : "Prêmio pendente"}
                      </StatusBadge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

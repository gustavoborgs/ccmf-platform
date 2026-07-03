"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { GuardianReferralPanel } from "@/modules/referrals/types";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";

type CopyTarget = "code" | "link" | null;

export function GuardianReferralPanel({ panel }: { panel: GuardianReferralPanel }) {
  const [copied, setCopied] = useState<CopyTarget>(null);
  const goalReached = panel.confirmedCount >= panel.goalCount;
  const progressPercent = Math.min(100, (panel.confirmedCount / panel.goalCount) * 100);

  async function copyText(value: string, target: CopyTarget) {
    await navigator.clipboard.writeText(value);
    setCopied(target);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="rounded-2xl border border-accent-200/80 bg-gradient-to-br from-accent-50/80 via-white to-primary-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs font-extrabold uppercase tracking-widest text-accent-700">
            Indique e ganhe curtidas
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-primary-800">
            Compartilhe o código de {panel.participantName}
          </h3>
        </div>
        {!panel.campaignActive && (
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
            Campanha pausada
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: panel.goalCount }, (_, index) => {
              const filled = index < panel.confirmedCount;
              return (
                <Star
                  key={index}
                  className={cn(
                    "size-6 transition",
                    filled
                      ? "fill-accent-500 text-accent-500"
                      : "text-primary-200",
                  )}
                />
              );
            })}
          </div>
          <p className="text-sm font-bold text-primary-800">
            {panel.confirmedCount} de {panel.goalCount} indicações confirmadas
          </p>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-100"
          role="progressbar"
          aria-valuenow={panel.confirmedCount}
          aria-valuemin={0}
          aria-valuemax={panel.goalCount}
          aria-label={`${panel.confirmedCount} de ${panel.goalCount} indicações confirmadas`}
        >
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {goalReached ? (
          <p className="mt-3 text-sm font-bold text-accent-700">
            Meta alcançada! Obrigado por espalhar o concurso.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            Falta{panel.goalCount - panel.confirmedCount === 1 ? "" : "m"}{" "}
            {panel.goalCount - panel.confirmedCount} indicação
            {panel.goalCount - panel.confirmedCount === 1 ? "" : "ões"} para completar a meta.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white/80 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-primary-700/60">Código</p>
            <p className="mt-0.5 font-mono text-lg font-extrabold tracking-widest text-primary-800">
              {panel.referralCode}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyText(panel.referralCode, "code")}
          >
            {copied === "code" ? "Copiado!" : "Copiar código"}
          </Button>
        </div>

        <div className="rounded-xl border border-primary-100 bg-white/80 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary-700/60">Link</p>
          <p className="mt-1 break-all text-sm text-ink-muted">{panel.shareUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyText(panel.shareUrl, "link")}
            >
              {copied === "link" ? "Link copiado!" : "Copiar link"}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        {panel.campaignActive ? (
          <>
            Cada indicação aprovada rende +{panel.rewardLikesCount} curtidas na página de{" "}
            {panel.participantName}.
          </>
        ) : (
          <>O compartilhamento continua disponível; os prêmios dependem da campanha ativa.</>
        )}
        {panel.pendingCount > 0 && (
          <>
            {" "}
            ({panel.pendingCount} aguardando aprovação)
          </>
        )}
      </p>
    </section>
  );
}

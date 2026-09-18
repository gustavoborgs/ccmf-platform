"use client";

import { useEffect, useRef, useState } from "react";
import { Checkout } from "@/modules/payments/components/checkout";
import {
  centsToAnalyticsValue,
  registrationFeeItem,
  trackEvent,
} from "@/shared/analytics/events";
import { Button } from "@/shared/ui/button";

/**
 * Step 3 — resumo da inscrição + checkout (PIX/Boleto/Cartão via Asaas).
 * Spec: docs/modules/payments.md
 */
export function SummaryStep({
  wizardRef,
  registrationId,
  summary,
  initialVoucherCode,
  onVoucherCodeChange,
  nevoaSessionCode,
  paymentPending,
}: {
  /** ref assinado do wizard (?ref=) — autoriza as actions sem login */
  wizardRef: string | null;
  registrationId: string;
  summary: {
    protocol: string;
    participantName: string;
    categoryName: string;
    feeFormatted: string;
    feeCents: number;
  };
  /** Cupom coletado no step do participante — validado no checkout. */
  initialVoucherCode?: string;
  onVoucherCodeChange?: (code: string) => void;
  nevoaSessionCode?: string | null;
  paymentPending: boolean;
}) {
  const summaryTopRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const [confirmed, setConfirmed] = useState(paymentPending);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    requestAnimationFrame(() => {
      summaryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [confirmed]);

  return (
    <div ref={summaryTopRef} className="space-y-5 scroll-mt-24">
      <div className="rounded-bubble bg-primary-50 p-4 sm:p-5">
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Protocolo</dt>
            <dd className="min-w-0 break-all text-right font-mono font-bold text-primary-800">
              {summary.protocol}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Participante</dt>
            <dd className="min-w-0 text-right font-bold">{summary.participantName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-ink-muted">Categoria</dt>
            <dd className="min-w-0 text-right font-bold">{summary.categoryName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="min-w-0 text-ink-muted">Curso: Como Gerenciar a Carreira Infantil</dt>
            <dd className="shrink-0 text-right font-bold text-primary-700">Brinde grátis</dd>
          </div>
          {initialVoucherCode && (
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-ink-muted">Cupom de desconto</dt>
              <dd className="min-w-0 text-right font-mono font-bold text-primary-800">
                {initialVoucherCode}
              </dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 border-t border-primary-100 pt-2.5">
            <dt className="text-ink-muted">Taxa de inscrição</dt>
            <dd className="font-bold text-accent-700">{summary.feeFormatted}</dd>
          </div>
          {initialVoucherCode && (
            <p className="text-xs text-ink-muted">
              O desconto do cupom é confirmado no pagamento, antes de gerar a cobrança.
            </p>
          )}
        </dl>
      </div>

      {!confirmed ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            Confira os dados antes de gerar a cobrança. Se precisar alterar algo, use os botões das
            etapas acima.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              trackEvent("begin_checkout", {
                currency: "BRL",
                value: centsToAnalyticsValue(summary.feeCents),
                items: registrationFeeItem(summary.feeCents),
              });
              setConfirmed(true);
            }}
          >
            Confirmar dados e ir para pagamento
          </Button>
        </div>
      ) : (
        <Checkout
          wizardRef={wizardRef}
          registrationId={registrationId}
          protocol={summary.protocol}
          feeFormatted={summary.feeFormatted}
          feeCents={summary.feeCents}
          initialVoucherCode={initialVoucherCode}
          onVoucherCodeChange={onVoucherCodeChange}
          nevoaSessionCode={nevoaSessionCode}
          hasPendingPayment={paymentPending}
        />
      )}
    </div>
  );
}

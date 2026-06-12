"use client";

import { useState } from "react";
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
  paymentPending,
}: {
  wizardRef: string | null;
  registrationId: string;
  summary: {
    protocol: string;
    participantName: string;
    categoryName: string;
    feeFormatted: string;
    feeCents: number;
  };
  paymentPending: boolean;
}) {
  const [confirmed, setConfirmed] = useState(paymentPending);

  return (
    <div className="space-y-5">
      <div className="rounded-bubble bg-primary-50 p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Protocolo</dt>
            <dd className="font-mono font-bold text-primary-800">{summary.protocol}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Participante</dt>
            <dd className="font-bold">{summary.participantName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Categoria</dt>
            <dd className="font-bold">{summary.categoryName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Taxa de inscrição</dt>
            <dd className="font-bold text-accent-700">{summary.feeFormatted}</dd>
          </div>
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
          hasPendingPayment={paymentPending}
        />
      )}
    </div>
  );
}

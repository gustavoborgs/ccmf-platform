"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/ui/cn";
import { Button } from "@/shared/ui/button";
import {
  createCheckoutAction,
  getActiveCheckoutAction,
  pollPaymentStatusAction,
  type CheckoutData,
} from "../actions";
import type { CreditCardInput } from "../validators";
import { CreditCardForm } from "./credit-card-form";

/**
 * Checkout do wizard (step de pagamento): PIX, Boleto e Cartão.
 * - PIX: QR Code + copia-e-cola, com polling de 5s até confirmar
 * - Boleto: link/linha digitável, polling de 30s (webhook é a fonte de verdade)
 * - Cartão: confirmação síncrona do Asaas
 * Spec: docs/modules/payments.md
 */

type Method = "PIX" | "BOLETO" | "CREDIT_CARD";

const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: "PIX", label: "PIX", hint: "Aprovação na hora" },
  { id: "CREDIT_CARD", label: "Cartão", hint: "Crédito à vista" },
  { id: "BOLETO", label: "Boleto", hint: "Até 3 dias úteis" },
];

const POLL_INTERVAL_MS: Record<Method, number> = {
  PIX: 5_000,
  BOLETO: 30_000,
  CREDIT_CARD: 10_000, // só usado se cartão ficar em análise
};

export function Checkout({
  wizardRef,
  registrationId,
  protocol,
  feeFormatted,
  hasPendingPayment,
  onPaid,
}: {
  /** ref assinado do wizard (?ref=) — autoriza as actions sem login */
  wizardRef: string | null;
  registrationId: string;
  protocol: string;
  feeFormatted: string;
  hasPendingPayment: boolean;
  onPaid?: () => void;
}) {
  const [method, setMethod] = useState<Method>("PIX");
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [restoring, setRestoring] = useState(hasPendingPayment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const markPaid = useCallback(() => {
    setPaid(true);
    onPaidRef.current?.();
  }, []);

  // Retomada: restaura a cobrança ativa (ex.: usuário fechou a tela do PIX).
  useEffect(() => {
    if (!hasPendingPayment) return;
    let cancelled = false;

    getActiveCheckoutAction(wizardRef, registrationId).then((result) => {
      if (cancelled) return;
      setRestoring(false);
      if (result.ok && result.data) {
        setCheckout(result.data);
        setMethod(result.data.method);
        if (result.data.paid) markPaid();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasPendingPayment, registrationId, wizardRef, markPaid]);

  // Polling: concilia o status com o Asaas enquanto a cobrança está pendente.
  useEffect(() => {
    if (!checkout || paid || checkout.status !== "PENDING") return;

    const interval = setInterval(async () => {
      const result = await pollPaymentStatusAction(wizardRef, checkout.paymentId);
      if (!result.ok) return;

      if (result.data.paid) {
        clearInterval(interval);
        markPaid();
      } else if (result.data.status !== "PENDING") {
        // venceu/cancelou → libera nova tentativa
        clearInterval(interval);
        setCheckout(null);
        setError("A cobrança expirou. Gere uma nova para concluir o pagamento.");
      }
    }, POLL_INTERVAL_MS[checkout.method]);

    return () => clearInterval(interval);
  }, [checkout, paid, wizardRef, markPaid]);

  async function startCheckout(input: { method: Method; creditCard?: CreditCardInput }) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createCheckoutAction(wizardRef, { registrationId, ...input });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCheckout(result.data);
      if (result.data.paid) markPaid();
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPixPayload(payload: string) {
    await navigator.clipboard.writeText(payload).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (paid) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-bubble bg-primary-50 p-6">
          <p className="font-display text-2xl font-extrabold text-primary-700">
            Pagamento confirmado!
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Inscrição <span className="font-mono font-bold text-primary-800">{protocol}</span>{" "}
            confirmada. Agora é com a nossa equipe de avaliação — você acompanha tudo pela sua
            conta.
          </p>
        </div>
        <Button href={`/inscricao/confirmada?protocolo=${encodeURIComponent(protocol)}`}>
          Concluir
        </Button>
      </div>
    );
  }

  if (restoring) {
    return <p className="py-6 text-center text-sm text-ink-muted">Carregando seu pagamento...</p>;
  }

  return (
    <div className="space-y-5">
      {/* Seleção do método */}
      {!checkout && (
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Forma de pagamento">
          {METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={method === item.id}
              onClick={() => {
                setMethod(item.id);
                setError(null);
              }}
              className={cn(
                "rounded-2xl border-2 p-3 text-center transition",
                method === item.id
                  ? "border-accent-600 bg-accent-50"
                  : "border-primary-100 bg-white hover:border-primary-200",
              )}
            >
              <span className="block font-display font-extrabold text-primary-800">
                {item.label}
              </span>
              <span className="block text-xs text-ink-muted">{item.hint}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-accent-50 p-3 text-sm font-semibold text-accent-800">
          {error}
        </p>
      )}

      {/* PIX / Boleto: gerar cobrança */}
      {!checkout && method !== "CREDIT_CARD" && (
        <Button
          className="w-full"
          disabled={submitting}
          onClick={() => void startCheckout({ method })}
        >
          {submitting
            ? "Gerando cobrança..."
            : method === "PIX"
              ? `Gerar PIX de ${feeFormatted}`
              : `Gerar boleto de ${feeFormatted}`}
        </Button>
      )}

      {/* Cartão: formulário */}
      {!checkout && method === "CREDIT_CARD" && (
        <CreditCardForm
          amountFormatted={feeFormatted}
          submitting={submitting}
          onSubmit={(creditCard) => void startCheckout({ method: "CREDIT_CARD", creditCard })}
        />
      )}

      {/* Cobrança gerada: PIX */}
      {checkout?.method === "PIX" && (
        <div className="space-y-4 text-center">
          {checkout.pixQrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${checkout.pixQrCodeBase64}`}
              alt="QR Code PIX"
              className="mx-auto size-52 rounded-2xl border border-primary-100"
            />
          )}
          <p className="text-sm text-ink-muted">
            Abra o app do seu banco e escaneie o QR Code, ou use o copia-e-cola:
          </p>
          {checkout.pixPayload && (
            <>
              <p className="break-all rounded-2xl bg-primary-50 p-3 font-mono text-xs text-primary-800">
                {checkout.pixPayload}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void copyPixPayload(checkout.pixPayload!)}
              >
                {copied ? "Copiado!" : "Copiar código PIX"}
              </Button>
            </>
          )}
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-700">
            <span className="size-2 animate-pulse rounded-full bg-accent-500" />
            Aguardando pagamento... confirmamos automaticamente.
          </p>
        </div>
      )}

      {/* Cobrança gerada: Boleto */}
      {checkout?.method === "BOLETO" && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-ink-muted">
            Boleto gerado! Vencimento em{" "}
            <strong className="text-ink">{checkout.dueDateFormatted}</strong>. A confirmação pode
            levar até 3 dias úteis após o pagamento.
          </p>
          {(checkout.boletoUrl ?? checkout.invoiceUrl) && (
            <Button
              href={(checkout.boletoUrl ?? checkout.invoiceUrl)!}
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              Abrir boleto
            </Button>
          )}
          <p className="text-sm text-ink-muted">
            Você receberá a confirmação assim que o banco compensar — e pode acompanhar pelo seu
            link de retomada.
          </p>
        </div>
      )}

      {/* Cartão em análise (raro) */}
      {checkout?.method === "CREDIT_CARD" && !paid && (
        <p className="rounded-2xl bg-primary-50 p-4 text-center text-sm font-semibold text-primary-800">
          Pagamento em análise. Você será notificado assim que for aprovado.
        </p>
      )}

      {/* Trocar forma de pagamento */}
      {checkout && checkout.status === "PENDING" && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setCheckout(null);
            setError(null);
          }}
        >
          Escolher outra forma de pagamento
        </Button>
      )}
    </div>
  );
}

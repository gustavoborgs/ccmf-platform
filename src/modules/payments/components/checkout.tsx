"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  centsToAnalyticsValue,
  registrationFeeItem,
  trackEvent,
  trackInscricaoConfirmadaOnce,
  trackPurchaseOnce,
} from "@/shared/analytics/events";
import { readNevoaSessionCode } from "@/shared/analytics/nevoa-session";
import { updateNevoaSessionCodeAction } from "@/modules/registrations/actions";
import { cn } from "@/shared/ui/cn";
import { Button } from "@/shared/ui/button";
import { TextInput } from "@/shared/ui";
import {
  createCheckoutAction,
  getActiveCheckoutAction,
  pollPaymentStatusAction,
  previewVoucherAction,
  type CheckoutData,
  type VoucherPreviewData,
} from "../actions";
import type { CreditCardInput } from "../validators";
import { CreditCardForm } from "./credit-card-form";

/**
 * Checkout do wizard (step de pagamento): cupom, PIX, Boleto, Cartão e FREE.
 * Spec: docs/modules/payments.md + docs/modules/vouchers.md
 */

type PaidMethod = "PIX" | "BOLETO" | "CREDIT_CARD" | "FREE";
type AsaasMethod = "PIX" | "BOLETO" | "CREDIT_CARD";

const METHODS: { id: AsaasMethod; label: string; hint: string }[] = [
  { id: "PIX", label: "PIX", hint: "Aprovação na hora" },
  { id: "CREDIT_CARD", label: "Cartão", hint: "Crédito à vista" },
  { id: "BOLETO", label: "Boleto", hint: "Até 3 dias úteis" },
];

const POLL_INTERVAL_MS: Record<AsaasMethod, number> = {
  PIX: 5_000,
  BOLETO: 30_000,
  CREDIT_CARD: 10_000,
};

export function Checkout({
  wizardRef,
  registrationId,
  protocol,
  feeFormatted,
  feeCents,
  initialVoucherCode,
  onVoucherCodeChange,
  nevoaSessionCode,
  hasPendingPayment,
  onPaid,
}: {
  wizardRef: string | null;
  registrationId: string;
  protocol: string;
  feeFormatted: string;
  feeCents: number;
  /** Cupom vindo do step do participante — validado aqui no servidor. */
  initialVoucherCode?: string;
  onVoucherCodeChange?: (code: string) => void;
  nevoaSessionCode?: string | null;
  hasPendingPayment: boolean;
  onPaid?: () => void;
}) {
  const checkoutTopRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const autoAppliedRef = useRef(false);
  const [method, setMethod] = useState<AsaasMethod>("PIX");
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [restoring, setRestoring] = useState(hasPendingPayment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  const [voucherInput, setVoucherInput] = useState(initialVoucherCode ?? "");
  const [voucherPreview, setVoucherPreview] = useState<VoucherPreviewData | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;
  const onVoucherCodeChangeRef = useRef(onVoucherCodeChange);
  onVoucherCodeChangeRef.current = onVoucherCodeChange;

  const chargeCents = voucherPreview?.amountCents ?? feeCents;
  const chargeFormatted = voucherPreview?.amountFormatted ?? feeFormatted;
  const isFree = chargeCents === 0;

  const markPaid = useCallback(
    (paymentMethod?: PaidMethod, amountOverride?: number) => {
      setPaid(true);
      const valueCents = amountOverride ?? chargeCents;
      trackPurchaseOnce({
        protocol,
        feeCents: valueCents,
        paymentMethod: paymentMethod === "FREE" ? undefined : paymentMethod,
      });
      trackInscricaoConfirmadaOnce({
        protocol,
        feeCents: valueCents,
        paymentMethod: paymentMethod === "FREE" ? undefined : paymentMethod,
      });
      onPaidRef.current?.();
    },
    [chargeCents, protocol],
  );

  useEffect(() => {
    if (!hasPendingPayment) return;
    let cancelled = false;

    getActiveCheckoutAction(wizardRef, registrationId).then((result) => {
      if (cancelled) return;
      setRestoring(false);
      if (result.ok && result.data) {
        setCheckout(result.data);
        if (result.data.method !== "FREE") {
          setMethod(result.data.method);
        }
        if (result.data.voucherCode) {
          setVoucherInput(result.data.voucherCode);
          setVoucherPreview({
            code: result.data.voucherCode,
            listCents: result.data.originalAmountCents,
            listFormatted: result.data.originalAmountFormatted,
            discountCents: result.data.discountCents,
            discountFormatted: result.data.discountFormatted ?? "",
            amountCents: result.data.amountCents,
            amountFormatted: result.data.amountFormatted,
            isFree: result.data.isFree,
          });
          onVoucherCodeChangeRef.current?.(result.data.voucherCode);
        }
        if (result.data.paid) markPaid(result.data.method, result.data.amountCents);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasPendingPayment, registrationId, wizardRef, markPaid]);

  useEffect(() => {
    if (!checkout || paid || checkout.status !== "PENDING") return;
    if (checkout.method === "FREE") return;

    const interval = setInterval(async () => {
      const result = await pollPaymentStatusAction(wizardRef, checkout.paymentId);
      if (!result.ok) return;

      if (result.data.paid) {
        clearInterval(interval);
        markPaid(checkout.method, checkout.amountCents);
      } else if (result.data.status !== "PENDING") {
        clearInterval(interval);
        setCheckout(null);
        setError("A cobrança expirou. Gere uma nova para concluir o pagamento.");
      }
    }, POLL_INTERVAL_MS[checkout.method]);

    return () => clearInterval(interval);
  }, [checkout, paid, wizardRef, markPaid]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    requestAnimationFrame(() => {
      checkoutTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [checkout?.paymentId, paid]);

  const applyVoucherCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      setVoucherLoading(true);
      setVoucherError(null);
      try {
        const result = await previewVoucherAction(wizardRef, {
          registrationId,
          code: trimmed,
        });
        if (!result.ok) {
          setVoucherPreview(null);
          setVoucherError(result.error);
          return;
        }
        setVoucherPreview(result.data);
        setVoucherInput(result.data.code);
        onVoucherCodeChangeRef.current?.(result.data.code);
      } finally {
        setVoucherLoading(false);
      }
    },
    [registrationId, wizardRef],
  );

  // Auto-valida cupom coletado no step do participante (sem reservar estoque).
  useEffect(() => {
    if (hasPendingPayment || autoAppliedRef.current) return;
    if (!initialVoucherCode?.trim()) return;
    autoAppliedRef.current = true;
    void applyVoucherCode(initialVoucherCode);
  }, [applyVoucherCode, hasPendingPayment, initialVoucherCode]);

  async function applyVoucher() {
    await applyVoucherCode(voucherInput);
  }

  function clearVoucher() {
    setVoucherPreview(null);
    setVoucherInput("");
    setVoucherError(null);
    onVoucherCodeChangeRef.current?.("");
  }

  async function startCheckout(input: {
    method: PaidMethod;
    creditCard?: CreditCardInput;
  }) {
    setSubmitting(true);
    setError(null);
    try {
      const sessionCode = nevoaSessionCode ?? readNevoaSessionCode();
      if (sessionCode) {
        await updateNevoaSessionCodeAction(wizardRef, {
          registrationId,
          nevoaSessionCode: sessionCode,
        });
      }

      const result = await createCheckoutAction(wizardRef, {
        registrationId,
        ...input,
        voucherCode: voucherPreview?.code,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCheckout(result.data);
      trackEvent("add_payment_info", {
        currency: "BRL",
        value: centsToAnalyticsValue(result.data.amountCents),
        payment_type: result.data.method,
        items: registrationFeeItem(result.data.amountCents),
      });
      trackEvent("payment_generated", {
        payment_type: result.data.method,
        status: result.data.status,
      });
      if (result.data.paid) markPaid(result.data.method, result.data.amountCents);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPixPayload(payload: string) {
    await navigator.clipboard.writeText(payload).catch(() => null);
    trackEvent("pix_code_copy", { payment_type: "PIX" });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (paid) {
    return (
      <div ref={checkoutTopRef} className="space-y-5 scroll-mt-24 text-center">
        <div className="rounded-bubble bg-primary-50 p-6">
          <p className="font-display text-2xl font-extrabold text-primary-700">
            {checkout?.isFree || chargeCents === 0
              ? "Inscrição confirmada!"
              : "Pagamento confirmado!"}
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
    <div ref={checkoutTopRef} className="space-y-5 scroll-mt-24">
      {!checkout && (
        <div className="space-y-3 rounded-bubble border border-primary-100 bg-white p-4 sm:p-5">
          {!voucherPreview ? (
            <>
              <p className="font-display text-sm font-extrabold text-primary-800">
                Cupom de desconto
              </p>
              <p className="text-xs text-ink-muted">
                Reduz o valor da taxa. Não é o código de indicação.
              </p>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void applyVoucher();
                }}
              >
                <TextInput
                  value={voucherInput}
                  onChange={(event) => {
                    setVoucherInput(event.target.value.toUpperCase());
                    setVoucherError(null);
                  }}
                  placeholder="Código do cupom"
                  disabled={voucherLoading}
                  className="min-w-0 flex-1 font-mono uppercase"
                  aria-label="Código do cupom"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                  disabled={voucherLoading || !voucherInput.trim()}
                >
                  {voucherLoading ? "Validando..." : "Aplicar"}
                </Button>
              </form>
              {voucherError && (
                <p className="text-sm font-semibold text-accent-700" role="alert">
                  {voucherError}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-primary-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono font-bold text-primary-800">
                    {voucherPreview.code}
                  </p>
                  <p className="text-xs font-semibold text-primary-700">Cupom aplicado</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={clearVoucher}
                  disabled={submitting}
                >
                  Remover
                </Button>
              </div>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Taxa de inscrição</dt>
                  <dd className="text-ink">{voucherPreview.listFormatted}</dd>
                </div>
                <div className="flex justify-between gap-3 text-primary-700">
                  <dt>Desconto do cupom</dt>
                  <dd className="font-bold">−{voucherPreview.discountFormatted}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-primary-100 pt-2 font-display font-extrabold">
                  <dt className="text-ink">Total a pagar</dt>
                  <dd className="text-accent-700">
                    {voucherPreview.isFree ? "Grátis" : voucherPreview.amountFormatted}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      )}

      {!checkout && !isFree && (
        <div
          className="grid grid-cols-3 gap-1.5 sm:gap-2"
          role="radiogroup"
          aria-label="Forma de pagamento"
        >
          {METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={method === item.id}
              onClick={() => {
                setMethod(item.id);
                setError(null);
                trackEvent("select_payment_method", { payment_type: item.id });
              }}
              className={cn(
                "min-w-0 rounded-2xl border-2 px-1.5 py-2.5 text-center transition sm:p-3",
                method === item.id
                  ? "border-accent-600 bg-accent-50"
                  : "border-primary-100 bg-white hover:border-primary-200",
              )}
            >
              <span className="block truncate font-display text-sm font-extrabold text-primary-800 sm:text-base">
                {item.label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight text-ink-muted sm:text-xs">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-accent-50 p-3 text-sm font-semibold text-accent-800">
          {error}
        </p>
      )}

      {!checkout && isFree && (
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={submitting}
            onClick={() => void startCheckout({ method: "FREE" })}
          >
            {submitting ? "Confirmando..." : "Confirmar inscrição gratuita"}
          </Button>
          <p className="text-center text-xs text-ink-muted">
            Seu cupom cobre 100% da taxa — nenhuma cobrança será gerada.
          </p>
        </div>
      )}

      {!checkout && !isFree && method !== "CREDIT_CARD" && (
        <Button
          className="w-full"
          disabled={submitting}
          onClick={() => void startCheckout({ method })}
        >
          {submitting
            ? "Gerando cobrança..."
            : method === "PIX"
              ? `Gerar PIX de ${chargeFormatted}`
              : `Gerar boleto de ${chargeFormatted}`}
        </Button>
      )}

      {!checkout && !isFree && method === "CREDIT_CARD" && (
        <CreditCardForm
          amountFormatted={chargeFormatted}
          submitting={submitting}
          onSubmit={(creditCard) => void startCheckout({ method: "CREDIT_CARD", creditCard })}
        />
      )}

      {checkout?.method === "PIX" && (
        <div className="space-y-4 text-center">
          {checkout.discountCents > 0 && (
            <p className="rounded-2xl bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800">
              Cupom {checkout.voucherCode}: total {checkout.amountFormatted}
            </p>
          )}
          {checkout.pixQrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${checkout.pixQrCodeBase64}`}
              alt="QR Code PIX"
              className="mx-auto size-40 max-w-full rounded-2xl border border-primary-100 sm:size-52"
            />
          )}
          <p className="text-sm text-ink-muted">
            Abra o app do seu banco e escaneie o QR Code, ou use o copia-e-cola:
          </p>
          {checkout.pixPayload && (
            <>
              <p className="break-all rounded-2xl bg-primary-50 p-3 font-mono text-[11px] leading-relaxed text-primary-800 sm:text-xs">
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
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent-500" />
            Aguardando pagamento... confirmamos automaticamente.
          </p>
        </div>
      )}

      {checkout?.method === "BOLETO" && (
        <div className="space-y-4 text-center">
          {checkout.discountCents > 0 && (
            <p className="rounded-2xl bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800">
              Cupom {checkout.voucherCode}: total {checkout.amountFormatted}
            </p>
          )}
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
              onClick={() => trackEvent("boleto_open", { payment_type: "BOLETO" })}
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

      {checkout?.method === "CREDIT_CARD" && !paid && (
        <p className="rounded-2xl bg-primary-50 p-4 text-center text-sm font-semibold text-primary-800">
          Pagamento em análise. Você será notificado assim que for aprovado.
        </p>
      )}

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

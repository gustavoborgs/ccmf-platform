# Módulo Payments

> Código: `src/modules/payments` · Status: implementado

## Objetivo

Checkout da taxa de inscrição via Asaas (PIX, Boleto e Cartão), confirmação
via webhook e conciliação ativa (polling) para feedback imediato do PIX.
Suporta voucher de desconto fixo (módulo `vouchers`) e inscrição gratuita
(`PaymentMethod.FREE`) quando o líquido zera.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `service.ts` | `ensureAsaasCustomer`, `createCheckout`, `syncPaymentStatus`, `getActivePayment` |
| `webhook-handler.ts` | `processAsaasWebhook` (idempotente por `WebhookEvent.externalId`) |
| `actions.ts` | `createCheckoutAction`, `getActiveCheckoutAction`, `pollPaymentStatusAction`, `previewVoucherAction` |
| `validators.ts` | `checkoutInputSchema` (discriminated union por método), `creditCardSchema` |
| `components/checkout.tsx` | UI do step de pagamento (cupom, PIX/Boleto/Cartão, FREE) |
| `components/credit-card-form.tsx` | Formulário de cartão (dados nunca persistidos) |

Rota do webhook: `src/app/api/webhooks/asaas/route.ts`.

## Fluxo de checkout

```
wizard (step 3) → createCheckoutAction(method [, creditCard] [, voucherCode])
  autorização: cookie do wizard OU sessão GUARDIAN (service revalida o dono)
  pré-condições: inscrição DRAFT/PENDING_PAYMENT + 2 fotos enviadas
  0. cotação: fee = Contest.registrationFeeCents; se voucherCode → vouchers.quoteVoucher
     amountCents = max(0, fee - discount)
  1. reuso: Payment PENDING não vencido do mesmo método + mesmo amountCents +
     mesmo voucherCode → retorna a cobrança existente. Cartão e FREE sempre novos.
  2. senão: cancela PIX/boleto PENDING no Asaas, marca CANCELED e libera
     redemption (`abandonPendingPayments`)
  3a. amountCents = 0 → Payment FREE RECEIVED (sem Asaas) + redemption CONFIRMED
      → Registration → revisão via sendRegistrationToReview
  3b. amountCents > 0:
      ensureAsaasCustomer → asaas.createPayment(value = amountCents/100)
      → Payment (snapshots original/discount/voucher) + redemption RESERVED
      → Registration PENDING_PAYMENT
      (se a TX local falhar após o createPayment, `DELETE /payments/:id` cancela
      a cobrança órfã; cartão aprovado síncrono → confirm redemption + revisão)
  4. Nevoa initiate_checkout com amountCents líquido (best-effort)
```

## Confirmação

Dupla via, sempre com a mesma régua de status (`STATUS_FROM_ASAAS`):

1. **Webhook (fonte de verdade)** — `POST /api/webhooks/asaas`:
   valida token → upsert `WebhookEvent` (idempotência) → mapeia evento →
   atualiza `Payment` e, se pago, confirma voucher + `Registration →` revisão →
   marca `processedAt`. Em OVERDUE/CANCELED/REFUNDED → libera redemption.
2. **Polling (conciliação ativa)** — `pollPaymentStatusAction` → `syncPaymentStatus`
   (mesma régua; confirma ou libera voucher conforme o status).

| Evento Asaas | PaymentStatus |
| --- | --- |
| `PAYMENT_CONFIRMED` | `CONFIRMED` |
| `PAYMENT_RECEIVED` | `RECEIVED` |
| `PAYMENT_OVERDUE` | `OVERDUE` |
| `PAYMENT_REFUNDED` | `REFUNDED` |
| `PAYMENT_DELETED` | `CANCELED` |

## Regras de negócio

1. Valor base sempre da edição (`Contest.registrationFeeCents`); desconto só via
   módulo `vouchers` no servidor — nunca confiar no client.
2. `Payment.amountCents` = líquido cobrado; `originalAmountCents` / `discountCents` /
   `voucherCode` são snapshots.
3. Vencimento padrão: 3 dias (Asaas).
4. Cartão: dados **nunca** tocam nosso banco — transitam apenas na chamada
   server-side ao Asaas.
5. Cobrança vencida não bloqueia novo checkout (novo `Payment` na mesma inscrição).
6. PIX/Boleto pendentes e não vencidos são **reutilizados** só se método, valor
   líquido e voucher forem iguais. Nova tentativa cancela a cobrança antiga no
   Asaas, marca `CANCELED` e libera redemptions `RESERVED`.
7. Confirmação assíncrona somente via webhook ou `syncPaymentStatus` (servidor);
   nunca confiar em redirect/estado do front. FREE confirma na própria request.
8. Erros do Asaas no checkout viram mensagem amigável (`AsaasError.friendlyMessage`)
   — nunca vazar o payload bruto.
9. Se a cobrança foi criada no Asaas mas a persistência local falhar (ex.: cupom
   esgotou entre quote e reserve), a cobrança órfã é cancelada no Asaas
   (best-effort via `asaas.deletePayment`).

## Permissões

- `createCheckout` / `syncPaymentStatus` / `getActivePayment` / preview de voucher:
  dono da inscrição (cookie assinado do wizard ou GUARDIAN logado —
  ownership revalidado no service).
- Webhook: público com token (`ASAAS_WEBHOOK_TOKEN`). Consultas no admin: `ADMIN`.

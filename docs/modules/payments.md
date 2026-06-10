# Módulo Payments

> Código: `src/modules/payments` · Status: implementado

## Objetivo

Checkout da taxa de inscrição via Asaas (PIX, Boleto e Cartão), confirmação
via webhook e conciliação ativa (polling) para feedback imediato do PIX.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `service.ts` | `ensureAsaasCustomer`, `createCheckout`, `syncPaymentStatus`, `getActivePayment` |
| `webhook-handler.ts` | `processAsaasWebhook` (idempotente por `WebhookEvent.externalId`) |
| `actions.ts` | `createCheckoutAction`, `getActiveCheckoutAction`, `pollPaymentStatusAction` |
| `validators.ts` | `checkoutInputSchema` (discriminated union por método), `creditCardSchema` |
| `components/checkout.tsx` | UI do step de pagamento (seleção de método, QR PIX, boleto, polling) |
| `components/credit-card-form.tsx` | Formulário de cartão (dados nunca persistidos) |

Rota do webhook: `src/app/api/webhooks/asaas/route.ts`.

## Fluxo de checkout

```
wizard (step 3) → createCheckoutAction(method [, creditCard])
  autorização: cookie do wizard OU sessão GUARDIAN (service revalida o dono)
  pré-condições: inscrição DRAFT/PENDING_PAYMENT + 2 fotos enviadas
  1. reuso: Payment PENDING não vencido do mesmo método → retorna a cobrança
     existente (evita duplicar PIX/boleto em reload). Cartão sempre cria nova.
  2. ensureAsaasCustomer (cria customer com CPF se necessário)
  3. asaas.createPayment (value em reais, externalReference = registrationId;
     cartão envia creditCard + holderInfo do guardian + remoteIp do request)
  4. PIX: busca QR Code (payload copia-e-cola + imagem base64)
  5. cria Payment + Registration → PENDING_PAYMENT
     (cartão aprovado síncrono → Payment CONFIRMED + Registration → PAID direto)
```

## Confirmação

Dupla via, sempre com a mesma régua de status (`STATUS_FROM_ASAAS`):

1. **Webhook (fonte de verdade)** — `POST /api/webhooks/asaas`:
   valida token → upsert `WebhookEvent` (idempotência) → mapeia evento →
   atualiza `Payment` e, se pago, `Registration → PAID` → marca `processedAt`
   (erro fica registrado para reprocessamento).
2. **Polling (conciliação ativa)** — a UI chama `pollPaymentStatusAction`
   (PIX a cada 5s, boleto a cada 30s) → `syncPaymentStatus` consulta
   `GET /payments/:id` no Asaas e aplica o mesmo mapeamento. Se o webhook já
   finalizou o pagamento local, o polling não consulta nada. Cobrança que
   venceu/cancelou no polling libera nova tentativa na UI.

| Evento Asaas | PaymentStatus |
| --- | --- |
| `PAYMENT_CONFIRMED` | `CONFIRMED` |
| `PAYMENT_RECEIVED` | `RECEIVED` |
| `PAYMENT_OVERDUE` | `OVERDUE` |
| `PAYMENT_REFUNDED` | `REFUNDED` |
| `PAYMENT_DELETED` | `CANCELED` |

## Regras de negócio

1. Valor sempre da edição (`Contest.registrationFeeCents`) — nunca vindo do client.
2. Vencimento padrão: 3 dias.
3. Cartão: dados **nunca** tocam nosso banco — transitam apenas na chamada
   server-side ao Asaas (action → service → client HTTP).
4. Cobrança vencida não bloqueia novo checkout (novo `Payment` na mesma inscrição).
5. PIX/Boleto pendentes e não vencidos são **reutilizados** — nunca duplicar cobrança.
6. Confirmação assíncrona somente via webhook ou `syncPaymentStatus` (servidor);
   nunca confiar em redirect/estado do front.
7. Erros do Asaas no checkout viram mensagem amigável (`AsaasError.friendlyMessage`,
   ex.: cartão recusado) — nunca vazar o payload bruto.

## Permissões

- `createCheckout` / `syncPaymentStatus` / `getActivePayment`: dono da inscrição
  (cookie assinado do wizard ou GUARDIAN logado — ownership revalidado no service).
- Webhook: público com token (`ASAAS_WEBHOOK_TOKEN`). Consultas no admin: `ADMIN`.

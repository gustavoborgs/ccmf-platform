# Integração — Asaas (gateway de pagamento)

> Código: `src/shared/integrations/asaas` · Consumidor: `src/modules/payments`

## Visão geral

API REST v3 do Asaas para cobranças PIX, Boleto e Cartão de Crédito.

- Sandbox: `https://api-sandbox.asaas.com/v3`
- Produção: `https://api.asaas.com/v3`
- Autenticação: header `access_token` com a API key (env `ASAAS_API_KEY`).
- Valores em **reais** (decimal) — converter de centavos na borda.

## Recursos usados

| Endpoint | Uso |
| --- | --- |
| `POST /customers` | Criar customer do responsável (1× por guardian, cache em `GuardianProfile.asaasCustomerId`) |
| `POST /payments` | Criar cobrança (`billingType`: PIX/BOLETO/CREDIT_CARD, `externalReference` = registrationId). Cartão envia `creditCard` + `creditCardHolderInfo` + `remoteIp` (exigido pelo Asaas) |
| `GET /payments/:id` | Conciliação ativa (polling do PIX/boleto via `syncPaymentStatus`) |
| `GET /payments/:id/pixQrCode` | QR Code (imagem base64) + payload copia-e-cola |

## Webhook

- Endpoint: `POST /api/webhooks/asaas`.
- Validação: header `asaas-access-token` deve bater com `ASAAS_WEBHOOK_TOKEN`
  (token configurado no painel do Asaas).
- Idempotência: `WebhookEvent.externalId` único; evento já processado é ignorado.
- Eventos tratados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
  `PAYMENT_REFUNDED`, `PAYMENT_DELETED`. Demais eventos são registrados e ignorados.
- Em falha de processamento respondemos 500 → o Asaas reenvia; o erro fica em
  `WebhookEvent.error` para reprocessamento manual.

## Cuidados

1. A fonte de verdade da confirmação é o **webhook**. O polling do front nunca
   confirma sozinho: ele chama `syncPaymentStatus`, que consulta `GET /payments/:id`
   no servidor e aplica a mesma régua de status do webhook (conciliação ativa).
   Exceção: cartão de crédito retorna `CONFIRMED` de forma síncrona no `POST /payments`.
2. Dados de cartão não são persistidos; transitam apenas na chamada ao Asaas.
3. `externalReference` sempre preenchido com o `registrationId` para conciliação.
4. Em sandbox, pagamentos PIX podem ser confirmados manualmente no painel.
5. Cliente HTTP é o único ponto com `fetch` para o Asaas — erros viram `AsaasError`.

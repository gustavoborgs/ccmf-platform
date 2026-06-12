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
| `POST /customers` | Criar customer do responsável (1× por guardian, cache em `GuardianProfile.asaasCustomerId`). Sempre com `notificationDisabled: true` para o Asaas não enviar e-mail/SMS/WhatsApp de cobrança |
| `GET /customers/:id` | Validar se o customer salvo ainda existe no ambiente/conta atual antes de criar cobrança |
| `PUT /customers/:id` | Garantir `notificationDisabled: true` em customers já existentes (criados antes da regra ou em outro ambiente) |
| `POST /payments` | Criar cobrança (`billingType`: PIX/BOLETO/CREDIT_CARD, `externalReference` = registrationId). Cartão envia `creditCard` + `creditCardHolderInfo` + `remoteIp` (exigido pelo Asaas). Notificações de cobrança são herdadas do customer — não há `notificationDisabled` neste endpoint |
| `GET /payments/:id` | Conciliação ativa (polling do PIX/boleto via `syncPaymentStatus`) |
| `GET /payments/:id/pixQrCode` | QR Code (imagem base64) + payload copia-e-cola |

## Webhook

- Endpoint: `POST /api/webhooks/asaas`.
- Validação: header `asaas-access-token` deve bater com `ASAAS_WEBHOOK_TOKEN`
  (token configurado no painel do Asaas).
- Idempotência: `WebhookEvent.externalId` único; evento já processado é ignorado.
  Se um payload de teste vier sem `id` do evento, usamos
  `<event>:<payment.id>` como chave estável.
- Eventos tratados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
  `PAYMENT_REFUNDED`, `PAYMENT_DELETED`. Demais eventos são registrados e ignorados.
- Payloads inválidos ou falhas de processamento são logados e a rota responde
  `200` para não pausar a fila do Asaas.

## Cuidados

1. A fonte de verdade da confirmação é o **webhook**. O polling do front nunca
   confirma sozinho: ele chama `syncPaymentStatus`, que consulta `GET /payments/:id`
   no servidor e aplica a mesma régua de status do webhook (conciliação ativa).
   Exceção: cartão de crédito retorna `CONFIRMED` de forma síncrona no `POST /payments`.
2. Dados de cartão não são persistidos; transitam apenas na chamada ao Asaas.
3. `externalReference` sempre preenchido com o `registrationId` para conciliação.
4. Em sandbox, pagamentos PIX podem ser confirmados manualmente no painel.
5. Cliente HTTP é o único ponto com `fetch` para o Asaas — erros viram `AsaasError`.
6. Notificações de cobrança do Asaas ficam desabilitadas no customer (`notificationDisabled: true`).
   A plataforma comunica o pagamento pela própria UI (PIX/boleto/cartão) e pelo webhook.

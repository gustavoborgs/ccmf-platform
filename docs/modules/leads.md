# Módulo Leads (CRM)

> Código: `src/modules/leads` · Status: em desenvolvimento

## Objetivo

Capturar abandono **pré-conta** (quem começou o step 1 do wizard e não
concluiu o cadastro) e alimentar a coluna inicial do board do CRM.

## Decisão de arquitetura (anti-redundância)

O funil pós-conta **não é persistido em Lead** — é 100% derivado de
`Registration` via `getEnrollmentFunnel()` (módulo `registrations`):

| Coluna do board | Fonte |
| --- | --- |
| Pré-conta | `Lead` com `stage = NEW` |
| Fotos pendentes | `Registration` DRAFT com < 2 fotos |
| Pronto p/ pagamento | `Registration` DRAFT com 2 fotos |
| Aguardando pagamento | `Registration` PENDING_PAYMENT |
| Pagamento confirmado | `Registration` PAID em diante |

A página `/admin/leads` compõe os dois services (leads + registrations) —
não há dependência circular entre módulos.

## Ciclo de vida do Lead

```
NEW → CONVERTED (conta criada — sai do funil de recuperação)
NEW → LOST      (descarte manual pelo admin, com nota)
```

## Captura

- Frontend dispara `captureLead` no step 1 (ex.: blur do e-mail/CPF) com os
  campos preenchidos até então — por isso `name`, `email`, `cpf` são opcionais
  (mínimo: e-mail **ou** CPF).
- Identificação por CPF ou e-mail (ambos únicos).
- `ensureGuardian` (registrations) chama `convertLead` ao criar a conta.

## API pública

| Função | Descrição | Quem chama |
| --- | --- | --- |
| `captureLead({name?,email?,cpf?,phone?,source?})` | Upsert progressivo pré-conta | action do wizard |
| `convertLead({email?,cpf?,guardianUserId})` | Marca CONVERTED ao criar conta | `registrations` |
| `markLeadLost(leadId, note)` | Descarte manual | `/admin/leads` |
| `listPreAccountLeads()` | Coluna pré-conta do board | `/admin/leads` |

## Retomada e automações (WhatsApp)

- O link de recuperação é permanente e usa o **próprio id** do lead ou da
  inscrição: `/inscricao/retomar/[id]` (ver `registrations.md`).
- Gatilhos de disparo baseados no estado **derivado** (nunca em coluna própria):

| Estado | Cadência sugerida | Para quando |
| --- | --- | --- |
| `Lead NEW` (pré-conta) | 15 min · 24h | lead converte ou é marcado LOST |
| `PENDING_PHOTOS` | 30 min · 24h | 2ª foto enviada |
| `READY_FOR_CHECKOUT` | 15 min · 2h · 24h | checkout criado |
| `PAYMENT_PENDING` | conforme vencimento da cobrança | webhook confirma |
| `PAYMENT_CONFIRMED` | — | nunca disparar recuperação |

- Evolução futura: tabela `CommunicationLog` (telefone, template, leadId/
  registrationId, sentAt/clickedAt) para evitar spam e medir conversão —
  criar spec antes de implementar.

## Regras de negócio

1. Lead cobre **somente** o pré-conta; nunca espelhar status de inscrição.
2. Lead `CONVERTED`/`LOST` não recebe mais updates de captura.
3. Toda transição gera `LeadEvent` (auditoria).
4. Dados capturados são sensíveis (CPF) — board restrito a `ADMIN`.

## Permissões

- Board e descarte: `ADMIN`. Captura/conversão: actions internas do wizard.

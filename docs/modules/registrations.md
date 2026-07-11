# Módulo Registrations

> Código: `src/modules/registrations` · Status: implementado

## Objetivo

Wizard público de inscrição da criança no concurso ativo, ciclo de vida da
inscrição (`Registration`) e integração com pagamento, indicações e automações.

## Responsabilidades

- Wizard `/inscricao` (responsável → participante → fotos → pagamento).
- Criação e atualização de `Registration` + `Participant` vinculados ao responsável.
- Transições pós-pagamento (`UNDER_REVIEW`) e revisão admin (`APPROVED`/`REJECTED`).
- Captura de atribuição Nevoa (`nevoaSessionCode`) e conversão `venda_fechada`.
- Não processa cobrança diretamente (módulo `payments`).

## Modelos envolvidos

| Modelo | Papel |
| --- | --- |
| `Registration` | Inscrição da criança na edição (`status`, `protocol`, `nevoaSessionCode`) |
| `Participant` | Dados da criança |
| `GuardianProfile` | Responsável (step 1) |
| `Lead` | Abandono pré-conta (step 1) |
| `Payment` | Cobrança Asaas (módulo `payments`) |

## API pública

| Função | Descrição |
| --- | --- |
| `createRegistration(...)` | Cria inscrição `DRAFT` + participante |
| `attachNevoaSessionCodeIfEmpty(...)` | Associa código Nevoa se ainda vazio |
| `sendRegistrationToReview(...)` | Pagamento confirmado → `UNDER_REVIEW` + efeitos |
| `approveRegistration(...)` | Admin aprova → `APPROVED` |
| `handlePaymentConfirmedSideEffects(...)` | Automações pós-pagamento |

## Regras de negócio

1. Inscrições só abrem com concurso em `REGISTRATION_OPEN`.
2. Máquina de estados: `DRAFT` → `PENDING_PAYMENT` → `UNDER_REVIEW` → `APPROVED`/`REJECTED`.
3. Pagamento confirma **somente via webhook** Asaas (ou cartão síncrono / polling como conciliação).
4. Ao abrir o wizard, o client lê `localStorage['nevoaTrack:session']` (snippet Nevoa) e envia
   `nevoaSessionCode` na criação da inscrição. Fallback no checkout se a sessão surgir depois.
5. Código armazenado **sem** prefixo `NV-` (prefixo é só exibição/WhatsApp).
6. Ao confirmar pagamento, se houver `nevoaSessionCode`, dispara conversão server-side
   `venda_fechada` na API Nevoa (`transaction_id = protocol`). Best-effort — falha não bloqueia fluxo.
7. `nevoaSessionCode` é dado de atribuição — **nunca** expor publicamente.

## Rotas relacionadas

- `/inscricao` — wizard
- `/inscricao/confirmada` — pós-pagamento (client-side analytics)
- `/inscricao/retomar/[id]` — retomada por link
- Server Actions em `src/modules/registrations/actions.ts`

## Permissões

- Wizard: público com ref assinado (`?ref=`) ou sessão `GUARDIAN`.
- Revisão admin: `ADMIN`.

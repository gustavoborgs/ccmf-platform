# Módulo Registrations

> Código: `src/modules/registrations` · Status: wizard implementado (steps 1–2 + retomada);
> checkout (step 3) integrado ao módulo payments (`components/checkout.tsx`)

## Implementação

| Peça | Arquivo |
| --- | --- |
| Services | `service.ts` |
| Server Actions do wizard | `actions.ts` |
| Ref do wizard (token HMAC na URL `?ref=`) | `wizard-ref.ts` |
| Componentes (steps, crop 3:4) | `components/` |
| Página do wizard | `src/app/(public)/inscricao/page.tsx` |
| Link de retomada (route handler — seta URL + cookie) | `src/app/(public)/inscricao/retomar/[id]/route.ts` |
| Pós-pagamento | `src/app/(public)/inscricao/confirmada/page.tsx` |
| Teste E2E do fluxo (backend) | `scripts/test-enrollment-flow.ts` |

## Objetivo

Ciclo de vida completo da inscrição: do cadastro do responsável até a
aprovação do participante na edição.

## Fluxo do wizard público (`/inscricao`) — 3 steps

```
Step 1 — Responsável (CPF-first)
  a. usuário digita CPF → checkCpfExists(cpf)
     · existe     → segue com nome/email/telefone; a inscrição é VINCULADA
                    ao responsável existente SEM autenticar (login fica para
                    um segundo momento, via senha ou recuperação)
     · não existe → libera cadastro: nome, e-mail, telefone, senha e
                    **endereço via CEP** (ViaCEP preenche rua/bairro/cidade/UF;
                    usuário informa número e complemento opcional)
  b. captureLead é disparado progressivamente (abandono pré-conta)

Step 2 — Participante + fotos
  a. dados da criança → createRegistration (categoria resolvida pela idade)
  b. crop 3:4 no client → requestPhotoUpload × 2 (módulo media)
  c. gate para o step 3: 2 fotos enviadas

Step 3 — Checkout
  · PIX / Boleto / Cartão → createCheckout (módulo payments)
  · confirmação só via webhook Asaas
```

## Link de retomada (`/inscricao/retomar/[id]`)

Link **permanente e simples** para automações de recuperação (WhatsApp/e-mail).
Aceita qualquer um destes identificadores:

| Formato | Exemplo |
| --- | --- |
| cuid da inscrição | `/inscricao/retomar/cmq75wjn50005et22ln96ek2d` |
| cuid do lead (pré-conta) | `/inscricao/retomar/clxyz...` |
| protocolo completo | `/inscricao/retomar/CCMF-2026-000001` |
| número curto (edição ativa) | `/inscricao/retomar/000001` |

O route handler redireciona para `/inscricao?ref=<token>` com o ref assinado
na URL e salva o mesmo token em cookie local para que `/inscricao` retome o
wizard mesmo quando o usuário volta sem query string.

| Estado do id | Link leva para |
| --- | --- |
| `Lead NEW` | Step 1 com prefill (nome/e-mail/telefone, exibidos mascarados) |
| `Lead CONVERTED/LOST` | Link inerte → início do wizard |
| `Registration DRAFT` < 2 fotos | Step 2 (fotos) |
| `Registration DRAFT` 2 fotos | Step 3 (checkout) |
| `Registration PENDING_PAYMENT` | Tela de pagamento (reaproveita cobrança ativa) |
| `Registration PAID+` | Página de status, sem CTA de recuperação |

Regras de segurança do link:

1. Nunca exibe CPF nem dados do cadastro existente — prefill apenas com o que
   o próprio lead digitou, mascarado (ex.: `a***@gmail.com`).
2. Não autentica: permite só continuar **aquela** inscrição, nunca acessar `/conta`.
3. Quem tem o link de uma inscrição paga vê apenas protocolo + status.

### Segurança do vínculo por CPF

- `checkCpfExists` retorna **apenas boolean** — nunca dados do responsável.
- O vínculo sem autenticação **não dá acesso** a dados existentes (perfil,
  outras inscrições): o wizard só escreve (nova inscrição), não lê.
- Dados digitados no wizard **não sobrescrevem** o cadastro existente.
- Acesso à `/conta` exige login normal (senha ou recuperação).
- O andamento do wizard pós-step-1 vive em um **token HMAC assinado**
  (`/inscricao?ref=...`) com `guardianId` + `registrationId`. O mesmo token
  pode ser salvo em cookie local de retomada. Quem tem o token continua aquela
  inscrição (mesmo modelo do link de retomada); ele não autentica nem dá acesso
  à `/conta`.
- Sem `?ref=` na URL, `/inscricao` tenta retomar pelo cookie local. Sem cookie
  válido, começa do início. O botão "Começar uma nova inscrição do início"
  limpa o ref/cookie e volta ao step 1.

## Máquina de estados (`Registration.status`)

| De | Para | Gatilho |
| --- | --- | --- |
| `DRAFT` | `PENDING_PAYMENT` | checkout criado |
| `PENDING_PAYMENT` | `PAID` | webhook Asaas (CONFIRMED/RECEIVED) |
| `PAID` | `UNDER_REVIEW` | entra na fila de revisão do admin |
| `UNDER_REVIEW` | `APPROVED` | admin aprova (publica no site) |
| `UNDER_REVIEW` | `REJECTED` | admin rejeita (`rejectionReason` obrigatório) |
| `APPROVED` | `SEMIFINALIST` | resultado da rodada 1 de votação |
| `SEMIFINALIST` | `WINNER` | resultado da rodada 2 |

## API pública

| Função | Descrição | Quem chama |
| --- | --- | --- |
| `checkCpfExists(cpf)` | Boolean — CPF já cadastrado? | step 1 do wizard |
| `ensureGuardian(step1Input)` | Vincula (CPF existente) ou cria conta (CPF novo, senha obrigatória) | step 1 do wizard |
| `createRegistration({guardianId, contestId, participant})` | Cria participante + inscrição com protocolo | wizard, `/conta` |
| `resumeEnrollment(guardianId, contestId)` | Em qual step o responsável parou (derivado) | wizard, `/conta` |
| `resolveResumeLink(publicId)` | Resolve o link permanente de retomada (lead ou inscrição) | `/inscricao/retomar/[id]` |
| `getEnrollmentFunnel(contestId)` | Funil de vendas derivado de Registration | `/admin/leads`, dashboard |
| `listGuardianRegistrations(guardianId)` | Inscrições do responsável | `/conta` |

## Regras de negócio

1. Uma criança só pode ter **uma inscrição por edição** (`@@unique participantId+contestId`).
2. Protocolo legível `CCMF-<ano>-<seq>` gerado na criação.
3. Categoria nunca é escolhida manualmente — sempre resolvida pela idade.
4. Consentimento de uso de imagem é obrigatório (`imageConsentAt`).
5. Exatamente 2 fotos por inscrição, **retrato 3:4** (mín. para pagar, máx.
   imposto pelo `media`).
6. Responsável pode ter vários filhos: nova inscrição via `/conta/inscricoes/nova`.
7. Inscrição `REJECTED` pode ser reativada pelo admin (volta a `UNDER_REVIEW`)
   após troca de fotos — evolução futura.

## Área do responsável (`/conta`)

- Lista inscrições com status e pagamento.
- `PAID+`: baixar fotos com moldura (módulo `media`) quando a edição tem
  `frameImageKey`.
- `APPROVED+`: link público do participante.
- `PENDING_PAYMENT`: retomar checkout.

## Permissões

- Criar/ver: `GUARDIAN` (somente as próprias). Aprovar/rejeitar: `ADMIN`.

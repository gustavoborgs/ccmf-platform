# Módulo Legacy Import

> Código: `scripts/import-legacy-participants.ts` · Status: em desenvolvimento

## Objetivo

Importar a base histórica do sistema antigo do Concurso Criança Mais Fotogênica
para o modelo atual, preservando edições, responsáveis, participantes,
inscrições, pagamentos, likes e referências das fotos antigas para posterior
migração ao S3.

## Responsabilidades

- Ler o dump SQL legado e extrair somente as tabelas necessárias.
- Gerar relatório de análise sem escrita no banco antes da importação.
- Criar ou reutilizar edições (`Contest`) e categorias (`Category`).
- Criar responsáveis (`User` + `GuardianProfile`) de forma conservadora.
- Criar participantes (`Participant`) e inscrições (`Registration`) a partir das
  faturas legadas (`cc_invoices`).
- Criar pagamentos históricos (`Payment`) sem misturar IDs da Juno/Click2Pay com
  IDs do Asaas.
- Gerar manifesto de fotos e molduras para download/upload posterior ao S3.
- Registrar mapeamentos de IDs legados para IDs novos em arquivos de auditoria.

Não baixa imagens no fluxo principal e não chama integrações de pagamento. A
confirmação de pagamentos futuros continua sendo responsabilidade do módulo
`payments` via webhook Asaas.

## Modelos envolvidos

Escreve:

- `Contest`
- `Category`
- `User`
- `GuardianProfile`
- `Participant`
- `Registration`
- `Payment`
- `Photo` apenas quando explicitamente habilitado

Lê/usa como fonte:

- `cc_concourses`
- `cc_categories`
- `cc_customers`
- `cc_childs`
- `cc_invoices`
- `cc_finalists`
- `cc_customers_steps`

## Casos de uso / API pública

| Comando | Descrição | Quem chama |
| --- | --- | --- |
| `npm run legacy:analyze` | Lê o SQL e gera relatórios sem escrever no banco | operador |
| `npm run legacy:import` | Importa dados normalizados para o banco atual | operador |
| `npm run legacy:photos` | Baixa fotos antigas, envia ao S3 e cria/atualiza `Photo` | operador |

Dump padrão: `data/legacy/criancam_site.sql` (temporário, ignorado pelo git).
Override: `--sql=/caminho/outro.sql` ou `LEGACY_SQL_FILE`.

## Regras de negócio

1. `cc_invoices` é a fonte primária para inscrições históricas, pois liga
   concurso, categoria, responsável e criança.
2. `cc_childs` complementa a criança com nome, nascimento, gênero, fotos, status
   público e likes.
3. `cc_customers` cria responsáveis. Deduplicação usa CPF válido primeiro, e-mail
   válido depois. E-mails ausentes, fakes ou duplicados recebem endereço técnico
   `legacy-customer-<id>@import.local`.
4. Responsáveis criados pela importação recebem `requiresPasswordSetup = true` e
   uma senha aleatória inutilizável. O login futuro deve passar por fluxo de
   primeiro acesso/recuperação de senha.
5. `cc_concourses.amount` é tratado como centavos e gravado em
   `registrationFeeCents`.
6. Categorias históricas são preservadas pelo `id_category` da fatura. Quando a
   categoria não existir na edição, o registro é enviado ao relatório de
   exceções.
7. Crianças sem data de nascimento não são importadas como participantes, porque
   `Participant.birthDate` é obrigatório no modelo atual.
8. Status de inscrição:
   - finalista vencedor (`cc_finalists.winner = 1`) vira `WINNER`;
   - finalista sem vitória vira `SEMIFINALIST`;
   - fatura paga e `status_site = 1` vira `APPROVED`;
   - fatura paga sem publicação vira `UNDER_REVIEW`;
   - fatura gerada/não paga vira `PENDING_PAYMENT`.
9. Pagamentos históricos podem criar `Payment`, mas `asaasPaymentId` permanece
   vazio para não confundir dados Juno/Click2Pay com Asaas.
10. O banco atual guarda somente `storageKey`. URLs e paths antigos de fotos ficam
   em manifesto até o comando `legacy:photos` enviar os arquivos ao S3.
11. A importação deve ser idempotente: reexecutar o script não deve duplicar
    registros já importados.

## Rotas relacionadas

Não há rotas públicas ou administrativas novas. A importação é operacional e
executada por scripts.

## Permissões

Somente operador com acesso ao ambiente e ao banco pode executar os comandos.
Nenhum endpoint HTTP é exposto.

## Pendências / evolução futura

- Validar manualmente registros ignorados por ausência de nascimento, categoria
  ou vínculo de responsável.
- Decidir se votos antigos em `cc_finalists_votes` serão preservados como
  `Vote`; a primeira versão importa somente o resultado final.
- Remover ou arquivar arquivos de auditoria quando a importação de produção for
  concluída.

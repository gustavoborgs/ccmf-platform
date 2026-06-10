# Módulo Guardians (visão admin)

> Código: consultas via `registrations`/Prisma · Status: planejado

## Objetivo

Visão administrativa dos responsáveis e seus participantes.

## Telas

### `/admin/responsaveis`

- Listagem paginada: nome, e-mail, telefone, nº de participantes,
  nº de inscrições pagas, data de cadastro.
- Busca por nome/e-mail/CPF.

### `/admin/responsaveis/[id]`

- Dados cadastrais + `asaasCustomerId`.
- Lista de participantes (filhos) com inscrições por edição e status.
- Histórico de pagamentos.
- Link para o lead correspondente no CRM (match por e-mail).

### `/admin/participantes`

- Listagem com **filtro por ano** (edição), categoria e status.
- Detalhe: fotos enviadas, dados da criança, responsável, pagamento,
  ações de aprovação/rejeição (máquina de estados em `registrations.md`).

## Regras de negócio

1. Somente leitura de dados pessoais; correções cadastrais ficam registradas.
2. Exclusão de responsável só se não houver inscrição paga (LGPD: processo de
   anonimização é evolução futura).

## Permissões

- Tudo: `ADMIN`.

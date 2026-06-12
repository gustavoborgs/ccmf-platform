# Módulo Guardians (visão admin)

> Código: `src/modules/guardians` · Status: em desenvolvimento

## Objetivo

Visão administrativa dos responsáveis e seus participantes.

## Telas

### `/admin/responsaveis`

- Listagem paginada: nome, e-mail, telefone, nº de participantes,
  nº de inscrições pagas, data de cadastro.
- Busca por nome/e-mail/CPF.
- Modal responsivo com dados cadastrais, endereço, integração Asaas e
  participantes vinculados.
- Edição administrativa de dados cadastrais/endereço e definição de nova senha.

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

1. Dados pessoais podem ser corrigidos por `ADMIN`; a ação deve validar e
   normalizar CPF/contatos/endereço antes de persistir.
2. Nova senha pode ser definida pelo admin sem expor a senha atual; tokens de
   recuperação pendentes do usuário são invalidados.
3. Exclusão de responsável só se não houver inscrição paga (LGPD: processo de
   anonimização é evolução futura).

## Permissões

- Tudo: `ADMIN`.

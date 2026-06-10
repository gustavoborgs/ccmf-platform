# Módulo Auth

> Código: `src/modules/auth` · Status: em desenvolvimento

## Objetivo

Autenticação e autorização para os três perfis: responsável (`GUARDIAN`),
jurado (`JUDGE`) e administrador (`ADMIN`).

## Decisões

- **Auth.js v5** com provider de credenciais (e-mail + senha, hash bcrypt).
- Sessão **JWT** (sem tabela de sessão) — `role` e `id` no token.
- Cadastro de responsável acontece dentro do wizard de inscrição
  (módulo `registrations`), não em página de signup isolada.
- **CPF existente no wizard**: a inscrição é vinculada ao responsável sem
  autenticar (decisão de conversão). O login acontece num segundo momento —
  senha existente ou recuperação. O wizard nunca expõe dados do cadastro
  existente (ver `registrations.md`).
- Jurados e admins são criados pelo admin (sem signup público).

## API pública

| Função | Descrição |
| --- | --- |
| `auth()` | Sessão atual (Server Components/Actions) |
| `requireUser()` | Redireciona para `/entrar` se anônimo |
| `requireRole(role)` | Exige role específica, senão redireciona |
| `signIn` / `signOut` | Fluxo de login/logout |

## Rotas

- `/entrar` — página de login (pública)
- `/api/auth/[...nextauth]` — handlers do Auth.js

## Regras

1. E-mail é único e sempre normalizado para lowercase.
2. Senha mínima de 8 caracteres (`guardianSignupSchema`).
3. Guards nos layouts dos grupos `(account)` e `(admin)`; actions sensíveis
   revalidam a role mesmo com guard no layout.

## Pendências

- Recuperação de senha por e-mail.
- Verificação de e-mail (`emailVerifiedAt` já existe no schema).

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
- `requiresPasswordSetup` marca responsáveis importados/convites que ainda não
  definiram a própria senha.
- Recuperação de senha aceita e-mail ou CPF. A resposta pública é sempre
  genérica para não revelar cadastro; se encontrar usuário, envia link por
  e-mail com token opaco, armazenado apenas como hash e válido por 1 hora.
- Ao definir a nova senha pelo link, tokens pendentes do usuário são invalidados,
  `requiresPasswordSetup` é desmarcado e o usuário é autenticado em seguida.
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
- `/recuperar-senha` — solicita link por e-mail ou CPF
- `/recuperar-senha/[token]` — define nova senha a partir do link
- `/api/auth/[...nextauth]` — handlers do Auth.js

## Regras

1. E-mail é único e sempre normalizado para lowercase.
2. Senha mínima de 8 caracteres (`guardianSignupSchema`).
3. Guards nos layouts dos grupos `(account)` e `(admin)`; actions sensíveis
   revalidam a role mesmo com guard no layout.
4. Token de recuperação nunca é persistido em claro; somente `tokenHash`
   (`sha256`) fica no banco.

## Pendências

- Verificação de e-mail (`emailVerifiedAt` já existe no schema).

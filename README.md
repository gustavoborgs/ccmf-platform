# Plataforma CCMF

Sistema de gestão do **Concurso Criança Mais Fotogênica do Brasil**: inscrições,
pagamentos (Asaas), galeria pública com likes, votação de jurados e CRM de leads.

## Stack

Next.js 15 (App Router) · Prisma 7 + PostgreSQL · Auth.js v5 · Tailwind 4 ·
S3 (imagens) · Asaas (PIX, Boleto, Cartão)

## Documentação

Toda a arquitetura e os specs dos módulos estão em [`docs/`](./docs/README.md).
Comece por `docs/01-visao-geral.md` e `docs/02-arquitetura.md`.

## Setup

```bash
# Node 20 (ver .nvmrc)
nvm use

npm install
cp .env.example .env   # preencher DATABASE_URL, AUTH_SECRET, S3_*, ASAAS_*

npm run db:up       # sobe o PostgreSQL local (Docker)
npm run db:migrate  # cria o schema e gera o client
npm run db:seed     # admin + concurso 2026 + categorias

npm run dev
```

Admin seed: `admin@ccmf.com.br` / `admin123` (trocar em produção).

## Scripts úteis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run db:up` | Sobe o PostgreSQL local via Docker Compose |
| `npm run db:down` | Para o PostgreSQL local |
| `npm run db:logs` | Logs do PostgreSQL |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Popula dados iniciais |
| `npm run db:reset` | Reseta o banco local e reaplica migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | Checagem de tipos |

## Estrutura

```
docs/           specs (fonte de verdade)
prisma/         schema + migrations + seed
src/app/        rotas (public / account / admin / api)
src/modules/    domínios: auth, contests, registrations, participants,
                payments, leads, judging, content, media
src/shared/     db, env, utils e integrações (asaas, s3)
```

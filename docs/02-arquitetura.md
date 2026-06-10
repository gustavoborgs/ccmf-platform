# 02 — Arquitetura

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) — Node 20 (`.nvmrc`)
- **Prisma 7** + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- **Auth.js v5** (JWT, credenciais)
- **Zod** para validação
- **Tailwind CSS 4**
- **S3** para imagens · **Asaas** para pagamentos

## Estrutura de pastas

```
prisma/                  # schema, migrations, seed
docs/                    # specs (fonte de verdade de produto/arquitetura)
src/
  app/                   # SOMENTE roteamento, layouts e composição de página
    (public)/            # páginas públicas
    (account)/conta/     # área do responsável
    (admin)/admin/       # área administrativa
    api/                 # route handlers (auth, webhooks)
  modules/               # módulos de domínio (regra de negócio)
    <modulo>/
      service.ts         # casos de uso (acesso ao banco via Prisma)
      validators.ts      # schemas Zod do módulo
      actions.ts         # Server Actions ("use server") que chamam o service
      components/        # componentes React específicos do módulo
  shared/                # infraestrutura transversal (sem regra de negócio)
    db.ts                # singleton do Prisma Client
    env.ts               # validação de variáveis de ambiente
    utils.ts             # helpers de domínio compartilhados
    integrations/        # clientes de serviços externos (asaas, s3)
  generated/prisma/      # Prisma Client gerado (não editar, não commitar lógica)
```

## Regras de dependência (importante)

```
app  →  modules  →  shared
              ↘︎       ↗︎
            generated/prisma
```

1. `app/` **não acessa o Prisma diretamente** — sempre via `modules/*/service.ts`
   ou `actions.ts`. Páginas só compõem UI e chamam services.
2. `modules/` podem depender de `shared/` e de **outros módulos via service
   público** (ex.: `payments` chama `leads`). Nunca importar arquivos internos
   de outro módulo (components, validators internos).
3. `shared/` não conhece nenhum módulo. Integrações externas (Asaas, S3) vivem
   aqui: são clientes "burros", sem regra de negócio.
4. Regra de negócio fica em `service.ts`; `actions.ts` apenas autentica
   (guards), valida (Zod) e delega.

## Convenções

- **Dinheiro em centavos** (`Int`), conversão para reais só na borda (UI/Asaas).
- **Imagens**: o banco guarda só a `storageKey`; URL pública montada com
  `getPublicUrl()`. Upload sempre via presigned URL.
- **Idade em meses** para resolução de categoria (`ageInMonths`).
- **Status como enums do Prisma** — máquinas de estado documentadas na spec de
  cada módulo. Nunca criar status novos sem atualizar a spec.
- **Idempotência em webhooks** via tabela `webhook_events`.
- Nomes de código em inglês; UI e docs em pt-BR.
- Validação com Zod em toda borda (forms, actions, route handlers).

## Como adicionar um novo módulo

1. Criar a spec em `docs/modules/<modulo>.md` usando `04-template-de-modulo.md`.
2. Adicionar modelos/enums no `prisma/schema.prisma` + migration.
3. Criar `src/modules/<modulo>/` com `service.ts` (+ `validators.ts`, `actions.ts`).
4. Criar rotas em `src/app/` que consomem o service.
5. Atualizar o índice em `docs/README.md`.

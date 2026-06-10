# Documentação da Plataforma CCMF

Specs da plataforma do **Concurso Criança Mais Fotogênica do Brasil**.

> **Para IAs e novos devs:** leia primeiro `01-visao-geral.md` e `02-arquitetura.md`.
> Toda feature nova deve seguir o padrão descrito em `04-template-de-modulo.md`
> e ter sua spec criada/atualizada em `docs/modules/` **antes** do código.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [01-visao-geral.md](./01-visao-geral.md) | Domínio, atores, fluxos principais e mapa de rotas |
| [02-arquitetura.md](./02-arquitetura.md) | Estrutura de pastas, camadas e convenções |
| [03-modelo-de-dados.md](./03-modelo-de-dados.md) | Entidades, enums e relacionamentos |
| [04-template-de-modulo.md](./04-template-de-modulo.md) | Template para spec de novos módulos |
| [05-design-system.md](./05-design-system.md) | Tokens, tipografia, componentes UI e diretrizes da marca |

### Módulos

| Módulo | Spec | Código |
| --- | --- | --- |
| Auth | [modules/auth.md](./modules/auth.md) | `src/modules/auth` |
| Contests | [modules/contests.md](./modules/contests.md) | `src/modules/contests` |
| Registrations | [modules/registrations.md](./modules/registrations.md) | `src/modules/registrations` |
| Participants | [modules/participants.md](./modules/participants.md) | `src/modules/participants` |
| Payments | [modules/payments.md](./modules/payments.md) | `src/modules/payments` |
| Leads (CRM) | [modules/leads.md](./modules/leads.md) | `src/modules/leads` |
| Judging | [modules/judging.md](./modules/judging.md) | `src/modules/judging` |
| Blog | [modules/blog.md](./modules/blog.md) | `src/modules/blog` |
| Content | [modules/content.md](./modules/content.md) | `src/modules/content` |
| Media | [modules/media.md](./modules/media.md) | `src/modules/media` |
| Guardians (admin) | [modules/guardians.md](./modules/guardians.md) | consultas via `registrations` |
| Legacy Import | [modules/legacy-import.md](./modules/legacy-import.md) | `scripts/import-legacy-participants.ts` |

### Integrações

| Serviço | Spec | Código |
| --- | --- | --- |
| Asaas (pagamentos) | [integrations/asaas.md](./integrations/asaas.md) | `src/shared/integrations/asaas` |
| S3 (imagens) | [integrations/s3.md](./integrations/s3.md) | `src/shared/integrations/s3` |

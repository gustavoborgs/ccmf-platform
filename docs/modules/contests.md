# Módulo Contests

> Código: `src/modules/contests` · Status: em desenvolvimento

## Objetivo

Gestão das edições anuais do concurso e suas categorias.

## Responsabilidades

- CRUD de edições (`Contest`): ano, nome, status, taxa, moldura, regulamento, data da live.
- CRUD de categorias por edição (faixas etárias em meses).
- Resolver a categoria correta para uma data de nascimento.
- Não gerencia inscrições (módulo `registrations`) nem votos (`judging`).

## Modelos

- Possui: `Contest`, `Category`.

## API pública

| Função | Descrição | Quem chama |
| --- | --- | --- |
| `getActiveContest()` | Edição com `REGISTRATION_OPEN` (no máx. uma) | wizard, home |
| `getContestByYear(year)` | Edição por ano | páginas públicas, admin |
| `findCategoryForBirthDate(contestId, birthDate)` | Categoria pela idade em meses | `registrations` |
| `listAdminContests(filters)` | Listagem paginada (busca + status) | `/admin/concursos` |
| `getAdminContestById(id)` | Edição + categorias + contagens | `/admin/concursos/[id]` |
| `createContest` / `updateContest` | CRUD da edição (ano único) | actions ADMIN |
| `updateContestStatus(id, status)` | Muda status validando edição única aberta | actions ADMIN |
| `createCategory` / `updateCategory` / `deleteCategory` / `moveCategory` | CRUD e reordenação de categorias (sem sobreposição de faixas; exclusão bloqueada com inscrições) | actions ADMIN |

## Regras de negócio

1. `year` é único; só **uma** edição pode estar `REGISTRATION_OPEN` por vez
   (validar ao mudar status).
2. Categoria é resolvida pela **idade na data da inscrição**, em meses completos.
3. Faixas de categorias da mesma edição não podem se sobrepor.
4. `frameImageKey` (moldura) e `regulationMd` são por edição.
5. Mudar status para `REGISTRATION_CLOSED` não afeta inscrições já pagas
   pendentes de aprovação.

## Rotas

- `/admin/concursos` — gestão (ADMIN)
- `/regulamento` — renderiza `regulationMd` da edição ativa

## Permissões

- Escrita: `ADMIN`. Leitura: pública.

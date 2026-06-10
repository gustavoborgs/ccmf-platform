# Módulo Judging

> Código: `src/modules/judging` · Status: planejado

## Objetivo

Votação técnica dos jurados para eleger 80 semifinalistas e 10 vencedores
(2 por categoria: 5 categorias × 2).

## Rodadas

| Rodada | Universo avaliado | Resultado |
| --- | --- | --- |
| 1 | Inscrições `APPROVED` | Top por categoria → `SEMIFINALIST` (80 no total) |
| 2 | Inscrições `SEMIFINALIST` | Top 2 por categoria → `WINNER` (10 no total) |

## API pública

| Função | Descrição |
| --- | --- |
| `castVote({judgeId, registrationId, score, round, comment})` | Voto 1–10, upsert (jurado pode revisar) |
| `getCategoryRanking(categoryId, round)` | Ranking por média de notas |

## Regras de negócio

1. Nota de 1 a 10; um voto por jurado × inscrição × rodada (upsert).
2. Votação só habilitada com `Contest.status = JUDGING`.
3. Ranking por **média**; desempate: quantidade de votos, depois decisão da organização.
4. Likes do público **não entram** no cálculo.
5. A promoção a `SEMIFINALIST`/`WINNER` é uma ação explícita do admin a partir
   do ranking (não automática), permitindo revisão editorial.
6. Jurado não vê notas dos outros jurados durante a rodada.

## UI

- `/jurados`: fila de avaliação por categoria (foto grande, nota, comentário).
- `/admin`: ranking consolidado + ação "promover selecionados".

## Permissões

- Votar: `JUDGE`. Ver ranking e promover: `ADMIN`.

# 04 — Template de Spec de Módulo

Copie este template para `docs/modules/<modulo>.md` ao criar um módulo novo.
A spec deve ser escrita/atualizada **antes** do código.

---

# Módulo <Nome>

> Código: `src/modules/<modulo>` · Status: planejado | em desenvolvimento | estável

## Objetivo

Uma ou duas frases sobre o problema que o módulo resolve.

## Responsabilidades

- O que o módulo faz (casos de uso).
- O que **não** faz (e qual módulo faz).

## Modelos envolvidos

Tabelas do Prisma que o módulo possui (escreve) e as que apenas lê.

## Casos de uso / API pública

| Função (service) | Descrição | Quem chama |
| --- | --- | --- |
| `exemplo()` | ... | action / página / outro módulo |

## Regras de negócio

Lista numerada das regras (limites, validações, máquina de estados).

## Rotas relacionadas

Páginas e route handlers que consomem o módulo.

## Permissões

Quais roles podem executar cada caso de uso.

## Pendências / evolução futura

Itens conhecidos fora do escopo atual.

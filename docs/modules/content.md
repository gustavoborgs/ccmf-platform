# Módulo Content

> Código: `src/modules/content` · Status: em desenvolvimento

## Objetivo

Conteúdo institucional do site: blog, vídeos, parceiros/patrocinadores e
mensagens de contato.

## Modelos

- Possui: `BlogPost`, `Video`, `Partner`, `ContactMessage`.

## API pública

| Função | Descrição |
| --- | --- |
| `listPublishedPosts(limit?)` | Posts publicados (home usa `limit: 4`) |
| `getPostBySlug(slug)` | Post individual |
| `listVideos()` | Vídeos publicados ordenados |
| `listPartnersByType()` | Parceiros ativos (MASTER / MEDIA / SPONSOR) |
| `createContactMessage(data)` | Salva mensagem do formulário |

## Regras de negócio

1. Post só aparece com `publishedAt` definido e no passado (agendamento).
2. Vídeos são embeds do YouTube (guardamos apenas a URL).
3. `Partner.type` separa as três vitrines da home: parceiros master, veículos
   de comunicação (apoio) e patrocinadores.
4. Formulário de contato é público; admin marca como lida (`readAt`).
5. Conteúdo é markdown (`BlogPost.content`), renderizado no server.

## Rotas

- Públicas: `/blog`, `/blog/[slug]`, `/videos`, `/contato`, seções da home,
  `/o-concurso` (página estática institucional).
- Admin: `/admin/conteudo` (CRUD de posts, vídeos, parceiros; inbox de contato).

## Permissões

- Leitura: pública. Escrita: `ADMIN`.

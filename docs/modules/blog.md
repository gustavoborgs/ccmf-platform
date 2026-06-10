# Módulo Blog

> Código: `src/modules/blog` · Status: em desenvolvimento

## Objetivo

Publicar conteúdo editorial do CCMF com foco em SEO, descoberta orgânica e uma
experiência de leitura rápida em mobile.

## Responsabilidades

- Listar posts publicados em `/blog`, com busca por termo (`?q=`) preservada na
  URL para compartilhamento e indexação.
- Exibir post individual em `/blog/[slug]`, com markdown renderizado no server,
  imagem de capa, autor, data de publicação e tempo estimado de leitura.
- Gerar metadados SEO/Open Graph e JSON-LD (`Blog`, `BlogPosting`) para melhorar
  previews e entendimento por buscadores.
- Ler somente posts com `publishedAt` definido e no passado.
- Gerenciar posts no admin, com rascunho, publicação imediata, agendamento,
  busca/filtro em tabela e upload de capa via S3.

## Modelos envolvidos

- Possui: `BlogPost`.
- Lê: `User` apenas para nome do autor.

## Casos de uso / API pública

| Função (service) | Descrição | Quem chama |
| --- | --- | --- |
| `listPublishedPosts(filters?)` | Lista posts publicados, com busca opcional por título, resumo ou conteúdo | `/blog` |
| `getPublishedPostBySlug(slug)` | Retorna um post publicado pelo slug | `/blog/[slug]` |
| `listRecentPosts(limit, excludeSlug?)` | Sugere posts recentes relacionados à leitura atual | `/blog/[slug]` |
| `estimateReadingMinutes(content)` | Calcula tempo de leitura estimado | páginas/componentes |
| `listAdminBlogPosts(filters)` | Lista posts no admin com busca, status e paginação | `/admin/blog` |
| `createBlogPost(input, authorId)` | Cria rascunho/post/agendamento | action admin |
| `updateBlogPost(postId, input, authorId)` | Atualiza conteúdo, slug, capa e publicação | action admin |
| `deleteBlogPost(postId)` | Remove post | action admin |
| `updateBlogPostCover(postId, coverKey)` | Atualiza capa após upload direto no S3 | action admin |

## Regras de negócio

1. Post público precisa ter `publishedAt` preenchido e menor ou igual à data
   atual; posts agendados não aparecem.
2. O slug é a URL canônica do post e deve ser único.
3. Busca pública é textual e não altera renderização server-side; o estado fica
   em `?q=` para mobile, compartilhamento e indexação.
4. Markdown é renderizado no server e suporta blocos simples: títulos, listas,
   tabelas e parágrafos com negrito.
5. Imagens seguem a regra global de mídia: banco guarda apenas `coverKey`, e a
   URL pública é montada com `getPublicUrl()`.
6. Capa administrativa usa chave `blog/<postId>/cover.<ext>` e aceita JPG, PNG
   ou WebP com dimensões mínimas de 900×500px.

## Rotas relacionadas

- Públicas: `/blog`, `/blog/[slug]`.
- Admin: `/admin/blog`, `/admin/blog/novo`, `/admin/blog/[id]`.

## Permissões

- Leitura: pública.
- Escrita: `ADMIN`.

## Pendências / evolução futura

- Campos editoriais avançados: categoria, tags, meta description customizada e
  imagem social específica.
- Paginação pública se o volume de posts crescer.

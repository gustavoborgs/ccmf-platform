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
- Gerar metadados SEO/Open Graph e JSON-LD (`Blog`, `BlogPosting`,
  `BreadcrumbList`) para melhorar previews e entendimento por buscadores.
- Ler somente posts com `publishedAt` definido e no passado.
- Gerenciar posts no admin, com rascunho, publicação imediata, agendamento,
  busca/filtro em tabela e upload de capa via S3.

## Modelos envolvidos

- Possui: `BlogPost`.
- Lê: `User` apenas para nome do autor.

### Campos editoriais de SEO

| Campo | Tipo | Uso |
| --- | --- | --- |
| `metaDescription` | `String?` | Description customizada (fallback: `excerpt`) |
| `category` | `String?` | Categoria editorial (ex.: `carreira`, `fotos`, `concurso`) para interlinking e `articleSection` |

## Casos de uso / API pública

| Função (service) | Descrição | Quem chama |
| --- | --- | --- |
| `listPublishedPosts(filters?)` | Lista posts publicados, com busca opcional por título, resumo ou conteúdo | `/blog` |
| `getPublishedPostBySlug(slug)` | Retorna um post publicado pelo slug | `/blog/[slug]` |
| `listRecentPosts(limit, excludeSlug?)` | Sugere posts recentes relacionados à leitura atual | `/blog/[slug]` |
| `listRelatedPosts(category, excludeSlug, limit?)` | Posts da mesma categoria editorial | `/blog/[slug]` |
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
4. Markdown é renderizado no server e suporte a blocos simples: títulos, listas,
   tabelas e parágrafos com negrito.
5. Imagens seguem a regra global de mídia: banco guarda apenas `coverKey`, e a
   URL pública é montada com `getPublicUrl()`.
6. Capa administrativa usa chave `blog/<postId>/cover.<ext>` e aceita JPG, PNG
   ou WebP com dimensões mínimas de 900×500px.
7. `metaDescription`, quando preenchida, tem prioridade sobre `excerpt` no
   `generateMetadata` e no JSON-LD.
8. Tom editorial: educativo e transparente — sem prometer fama, agenciamento ou
   resultado garantido (`docs/06-estrategia-comercial-inscricoes.md`).

## Rotas relacionadas

- Públicas: `/blog`, `/blog/[slug]`.
- Admin: `/admin/blog`, `/admin/blog/novo`, `/admin/blog/[id]`.

## Permissões

- Leitura: pública.
- Escrita: `ADMIN`.

## Cluster editorial — carreira de modelo infantil

Posts-alvo (seed em rascunho via `scripts/seed-blog-seo-posts.ts`):

1. Como colocar meu filho para ser modelo
2. Como gerenciar a carreira de modelo do seu filho
3. Agência de modelo infantil é confiável?
4. Book fotográfico infantil vale a pena?
5. Modelo mirim: idade, direitos e lei
6. Como tirar boas fotos do seu filho em casa
7. Concurso de fotogenia infantil: como funciona
8. Autoestima infantil e concursos sérios

## Pendências / evolução futura

- Paginação pública se o volume de posts crescer.
- Imagem social específica por post (além da capa).

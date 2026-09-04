# Módulo Content

> Código: `src/modules/content` · Status: implementado (inbox de contato fica
> para evolução futura)

## Objetivo

Conteúdo institucional do site: vídeos, parceiros/patrocinadores e mensagens de
contato. Blog foi separado em `docs/modules/blog.md`.

## Modelos

- Possui: `Video`, `Partner`, `ContactMessage`.
- Legado no schema: `BlogPost` agora é responsabilidade do módulo `blog`.

## API pública

| Função | Descrição |
| --- | --- |
| `listVideos()` | Vídeos publicados ordenados |
| `listPartnersByType()` | Parceiros ativos (MASTER / MEDIA / SPONSOR) |
| `listAdminPartners(filters)` | Listagem administrativa paginada de parceiros |
| `createPartner(data)` / `updatePartner(id, data)` / `deletePartner(id)` | CRUD administrativo de parceiros |
| `createContactMessage(data)` | Salva mensagem do formulário |

## Regras de negócio

1. Vídeos são embeds do YouTube (guardamos apenas a URL).
2. `Partner.type` separa as três vitrines da home: parceiros master, veículos
   de comunicação (apoio) e patrocinadores (`PartnersShowcase`; grupos vazios
   não aparecem).
3. Logos de parceiros usam `logoKey` em S3 e devem ser recortados no admin para
   800x400px (2:1) antes do upload.
4. Formulário de contato é público (`createContactMessageAction`); admin marca
   como lida (`readAt`) — inbox fica para evolução futura.
5. Imagens institucionais (crianças e fundadora) são assets estáticos em
   `public/people/` — não passam pelo S3. Fotos reais da Live Revelação:
   `live-revelacao-selfie.jpg` (hero da home e seção "Live Revelação" em
   `/o-concurso`) e `fundadora-criancas-live.jpg` (seção "Quem organiza" em
   `/o-concurso`, com Claudia Cavalcante citada nominalmente).

## Página pilar SEO — Carreira de modelo infantil

Rota pública `/carreira-de-modelo-infantil` (server-rendered, conteúdo estático
no App Router). Objetivo: capturar buscas orgânicas e citações em motores
generativos (GEO) sobre carreira de modelo fotográfico infantil.

Regras:

1. Responde direto no primeiro parágrafo; inclui FAQ na linguagem das mães.
2. Interliga `/curso`, `/blog`, `/inscricao` e `/o-concurso`.
3. Não promete fama, agenciamento ou resultado garantido (ver
   `docs/06-estrategia-comercial-inscricoes.md`).
4. Emite JSON-LD `FAQPage` + `BreadcrumbList`.
5. Entra no sitemap com prioridade alta.

## Rotas

- Públicas: `/videos`, `/contato`, seções da home, `/o-concurso` (página
  estática institucional), `/carreira-de-modelo-infantil` (pilar SEO).
- Admin: `/admin/videos` para vídeos, `/admin/parceiros` para parceiros. Inbox
  de contato fica para evolução futura.

## Permissões

- Leitura: pública. Escrita: `ADMIN`.

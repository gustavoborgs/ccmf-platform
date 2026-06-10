# 01 — Visão Geral

## Domínio

Plataforma de gestão do concurso anual de fotografia infantil **Criança Mais
Fotogênica do Brasil** (site original: https://criancamaisfotogenica.com.br/).

Ciclo anual do concurso:

1. Admin cria a edição do ano (categorias, taxa, moldura, regulamento).
2. Responsáveis criam conta, cadastram criança(s), enviam 2 fotos e pagam a inscrição.
3. Admin revisa e aprova as inscrições pagas — aprovadas aparecem no site público.
4. Público curte e compartilha as páginas dos participantes.
5. Jurados votam (rodada 1 → 80 semifinalistas; rodada 2 → 10 vencedores, 2 por categoria).
6. Resultados publicados na live de revelação; vencedores ganham destaque no site.

## Atores

| Ator | Role | Acesso |
| --- | --- | --- |
| Visitante | — | Páginas públicas, like, compartilhamento |
| Responsável | `GUARDIAN` | `/conta` — gerencia inscrições dos filhos |
| Jurado | `JUDGE` | `/jurados` — votação técnica |
| Administrador | `ADMIN` | `/admin` — gestão completa |

## Categorias (por idade na inscrição)

| Categoria | Faixa |
| --- | --- |
| Bebê | até 10 meses |
| Mirim | 11 a 23 meses |
| Infantil | 2 a 5 anos |
| Juvenil | 6 a 9 anos |
| Teen | 10 a 14 anos |

As categorias são cadastradas **por edição** (`Category` pertence a `Contest`),
permitindo mudanças de faixa entre anos.

## Mapa de rotas

### Público — grupo `(public)`

| Rota | Página |
| --- | --- |
| `/` | Home (CTA, prêmios, vencedores, blog, parceiros, patrocinadores) |
| `/inscricao` | Wizard de inscrição (3 steps: responsável CPF-first, participante + fotos, pagamento) |
| `/o-concurso` | História do concurso |
| `/regulamento` | Regulamento da edição ativa |
| `/videos` | Vídeos (YouTube embeds) |
| `/participantes` | Hub por ano |
| `/participantes/[ano]` | Galeria de aprovados do ano |
| `/participantes/[ano]/[slug]` | Página do participante (like + share) |
| `/blog`, `/blog/[slug]` | Blog |
| `/contato` | Formulário de contato |
| `/entrar` | Login |

### Responsável — grupo `(account)`

| Rota | Página |
| --- | --- |
| `/conta` | Minhas inscrições (status, foto com moldura) |
| `/conta/inscricoes/nova` | Nova inscrição (reaproveita o wizard) |
| `/conta/inscricoes/[id]` | Detalhe da inscrição + pagamento |

### Admin — grupo `(admin)`

| Rota | Página |
| --- | --- |
| `/admin` | Dashboard (KPIs: inscrições, pagamentos, funil) |
| `/admin/concursos` | Gestão de edições (ano, status, moldura, taxa, categorias) |
| `/admin/leads` | CRM kanban do funil de inscrição |
| `/admin/responsaveis` | Listagem e detalhe dos responsáveis |
| `/admin/participantes` | Listagem (filtro por ano) e detalhe + aprovação |
| `/admin/conteudo` | Blog, vídeos, parceiros, patrocinadores |

### Jurados

| Rota | Página |
| --- | --- |
| `/jurados` | Fila de avaliação por categoria/rodada |

### API

| Rota | Função |
| --- | --- |
| `/api/auth/[...nextauth]` | Auth.js |
| `/api/webhooks/asaas` | Webhook de pagamentos (POST) |

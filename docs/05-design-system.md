# 05 — Design System

> Tokens: `src/app/globals.css` (Tailwind 4 `@theme`) · Componentes: `src/shared/ui`
> Assets da marca: `public/brand/`

## Análise da marca

O logo é um lettering "bubble" (formas infladas, super arredondadas, contorno
generoso) com **gradiente roxo → magenta → pink** e tipografia display rounded.
O selo de verificado nas redes traz um **ciano** de apoio. A linguagem visual
da plataforma deriva disso: cantos muito arredondados, gradiente como elemento
hero, sombras coloridas suaves e tom lúdico-premium.

## Assets

| Arquivo | Uso | Restrição |
| --- | --- | --- |
| `public/brand/isotipo.png` | Header, footer, favicon, avatar | Tem alpha — usa em qualquer fundo |
| `public/brand/logo-full.png` | Hero, materiais | **Fundo preto embutido** — só sobre fundos escuros/gradiente; pedir versão transparente ao design |
| `public/brand/banner-social.png` | Referência de identidade social | — |

## Cores

### Marca (extraídas do logo)

| Token | Hex | Uso |
| --- | --- | --- |
| `brand-purple` | `#8E18B4` | Início do gradiente, títulos |
| `brand-magenta` | `#C414A0` | Meio do gradiente |
| `brand-pink` | `#EC1380` | Fim do gradiente, CTA |
| `brand-cyan` | `#2BC4F2` | Apoio (badges, links de destaque) |

### Escalas semânticas

- `primary-50…900` — escala do roxo (`primary-600` = brand-purple). Títulos,
  navegação ativa, bordas suaves (`primary-100`).
- `accent-50…900` — escala do pink (`accent-600` = brand-pink). Botões,
  links, kickers de seção.
- `info-400…600` — ciano de apoio.
- `surface` `#FFFAFD` / `surface-muted` `#FAF0F7` — fundos quentes.
- `ink` `#2D1230` / `ink-muted` `#7A5E7D` — texto (roxo profundo, não preto puro).

### Gradiente oficial

Utilitários prontos (em `globals.css`):

- `bg-brand-gradient` — fundo 135° roxo → magenta → pink (hero, footer, CTAs).
- `text-brand-gradient` — texto com o gradiente (títulos de seção).

## Tipografia

| Papel | Fonte | Token | Uso |
| --- | --- | --- | --- |
| Display | **Baloo 2** (rounded, ecoa o lettering bubble) | `font-display` | h1–h4 (automático), botões, kickers |
| Texto | **Nunito** (rounded, alta legibilidade) | `font-sans` | body (padrão) |

Carregadas via `next/font` no `src/app/layout.tsx` (`--font-baloo`, `--font-nunito`).

## Forma e profundidade

- `rounded-bubble` (`1.75rem`) — cards e blocos; botões são sempre `rounded-full` (pílula).
- `shadow-brand` / `shadow-brand-lg` — sombras com tinta da marca (nunca cinza puro).
- Imagens de participantes: sempre **retrato 3:4** (`PHOTO_ASPECT`), cantos `rounded-bubble`.

## Componentes (`src/shared/ui`)

| Componente | Variantes | Notas |
| --- | --- | --- |
| `Button` | `primary` (gradiente) · `secondary` (pink sólido) · `outline` · `ghost`; tamanhos `sm/md/lg` | Vira `<Link>` automaticamente quando recebe `href` |
| `Card` | — | Bubble + sombra colorida |
| `Container` | — | `max-w-6xl` padrão do site |
| `SectionHeading` | `align: center/left` | Kicker pink + título com gradiente |
| `Table…` | `Table/Header/Body/Row/Head/Cell/Footer` | Primitivos de tabela (estilo shadcn) |
| `Popover` | `Trigger/Content` + `usePopover()` | Sem dependência externa; fecha com clique fora/Escape |
| `Dialog` | `Trigger/Content/Title/Description/Close` + `useDialog()` | Controlado ou não controlado |
| `cn()` | — | clsx + tailwind-merge |

## Padrão de listagem administrativa (`shared/ui/data-table`)

Kit para listas com volume de dados (referência: ClickUp/shadcn data table).
O estado de busca, filtros e paginação vive na **URL** (`searchParams`):

1. A página (Server Component) valida os `searchParams` com o schema Zod do
   módulo e chama o service paginado (`{ items, pagination }`).
2. `DataTableToolbar` (client) — busca com debounce, filtros facetados em
   popover e volume por página; cada mudança atualiza a URL e volta à página 1.
3. `DataTable` — tabela genérica tipada por colunas (`DataTableColumn<Row>`),
   com células definidas na própria página.
4. `DataTablePagination` (client) — anterior/próxima preservando os demais
   parâmetros da URL.

Referência de uso: `src/app/(admin)/admin/responsaveis/page.tsx` e
`src/app/(admin)/admin/participantes/page.tsx`.

## Diretrizes de uso

1. **Um gradiente por dobra**: hero/footers usam `bg-brand-gradient`; o miolo
   da página fica em `surface` com acentos — evita poluição visual.
2. CTA primário da página é único (`primary` ou branco sobre gradiente).
3. Texto sobre gradiente: branco com opacidades (`text-white/85`) — nunca cinza.
4. Não usar preto puro: texto é `ink`, secundário `ink-muted`.
5. Emojis/ícones: preferir ícones arredondados (lucide) na cor `accent-600`.
6. Acessibilidade: `accent-600` sobre branco passa AA para texto ≥ 18px e
   componentes; para texto pequeno usar `accent-700`/`primary-700`.

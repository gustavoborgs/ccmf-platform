import type { Metadata } from "next";
import { BlogCard, type BlogCardData } from "@/modules/blog/components/blog-card";
import { BlogSearch } from "@/modules/blog/components/blog-search";
import { estimateReadingMinutes } from "@/modules/blog/format";
import { absoluteUrl } from "@/modules/blog/seo";
import { listPublishedPosts, type PublicBlogPost } from "@/modules/blog/service";
import { publicBlogFiltersSchema } from "@/modules/blog/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card, Container } from "@/shared/ui";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Dicas para fotos infantis, bastidores do Concurso Criança Mais Fotogênica e orientações para responsáveis acompanharem cada etapa.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog do Criança Mais Fotogênica",
    description:
      "Conteúdo útil para preparar sua criança, acompanhar o concurso e aproveitar melhor a experiência CCMF.",
    type: "website",
    url: "/blog",
  },
};

export default async function BlogPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = publicBlogFiltersSchema.parse({ q: rawParams.q });
  const posts = await listPublishedPosts(filters);
  const cards = posts.map(toBlogCardData);
  const [featuredPost, ...otherPosts] = cards;
  const hasQuery = Boolean(filters.q);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Blog do Criança Mais Fotogênica",
            description: metadata.description,
            url: absoluteUrl("/blog"),
          }),
        }}
      />

      <section className="bg-brand-gradient text-white">
        <Container className="py-10 sm:py-16">
          <p className="mb-2 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
            Blog CCMF
          </p>
          <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
            Dicas e bastidores para viver melhor o concurso
          </h1>
          <p className="mt-4 max-w-2xl text-white/90 sm:text-lg">
            Conteúdos práticos para fotos infantis, preparação da criança,
            acompanhamento das etapas e novidades oficiais do CCMF.
          </p>
        </Container>
      </section>

      <section className="sticky top-16 z-40 border-b border-primary-100 bg-surface/95 py-3 backdrop-blur">
        <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <BlogSearch initialQuery={filters.q} />
          <p className="text-sm font-semibold text-ink-muted">
            {cards.length === 1
              ? "1 artigo publicado"
              : `${cards.length.toLocaleString("pt-BR")} artigos publicados`}
          </p>
        </Container>
      </section>

      <section className="py-8 sm:py-12">
        <Container>
          {cards.length > 0 ? (
            <div className="space-y-8">
              {featuredPost && !hasQuery && <BlogCard post={featuredPost} featured />}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(hasQuery ? cards : otherPosts).map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          ) : (
            <Card className="mx-auto max-w-2xl py-12 text-center">
              <h2 className="font-display text-2xl font-extrabold text-primary-700">
                {hasQuery ? "Nenhum artigo encontrado" : "O blog está sendo preparado"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-ink-muted">
                {hasQuery
                  ? "Tente buscar por outro termo ou volte para a lista completa."
                  : "Em breve, conteúdos oficiais do CCMF aparecerão aqui."}
              </p>
              {hasQuery && (
                <Button href="/blog" variant="outline" size="sm" className="mt-6">
                  Limpar busca
                </Button>
              )}
            </Card>
          )}
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="rounded-bubble bg-surface-muted px-6 py-10 text-center sm:px-10">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-700">
              Próximo passo
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-extrabold text-primary-700 sm:text-3xl">
              Pronto para colocar sua criança em destaque?
            </h2>
            <Button href="/inscricao" size="lg" className="mt-6">
              Fazer inscrição
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

function toBlogCardData(post: PublicBlogPost): BlogCardData {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverUrl: post.coverKey ? getPublicUrl(post.coverKey) : null,
    publishedAt: post.publishedAt,
    authorName: post.author?.name ?? null,
    readingMinutes: estimateReadingMinutes(post.content),
  };
}

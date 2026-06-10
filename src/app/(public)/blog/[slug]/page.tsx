import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BlogCard, formatPostDate, type BlogCardData } from "@/modules/blog/components/blog-card";
import { BlogMarkdown } from "@/modules/blog/components/blog-markdown";
import { estimateReadingMinutes } from "@/modules/blog/format";
import { absoluteUrl, mediaUrl, postUrl } from "@/modules/blog/seo";
import {
  getPublishedPostBySlug,
  listRecentPosts,
  type PublicBlogPost,
} from "@/modules/blog/service";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Container } from "@/shared/ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const loadPost = cache(async (slug: string) => getPublishedPostBySlug(slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Post não encontrado" };

  const coverUrl = mediaUrl(post.coverKey);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: coverUrl
        ? [
            {
              url: coverUrl,
              alt: `Imagem de capa: ${post.title}`,
            },
          ]
        : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const recentPosts = await listRecentPosts(3, post.slug);
  const readingMinutes = estimateReadingMinutes(post.content);
  const coverUrl = post.coverKey ? getPublicUrl(post.coverKey) : null;
  const absoluteCoverUrl = mediaUrl(post.coverKey);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            image: absoluteCoverUrl ? [absoluteCoverUrl] : undefined,
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: post.author?.name
              ? {
                  "@type": "Person",
                  name: post.author.name,
                }
              : {
                  "@type": "Organization",
                  name: "Concurso Criança Mais Fotogênica",
                },
            publisher: {
              "@type": "Organization",
              name: "Concurso Criança Mais Fotogênica",
              url: absoluteUrl("/"),
            },
            mainEntityOfPage: postUrl(post.slug),
          }),
        }}
      />

      <article>
        <header className="bg-brand-gradient text-white">
          <Container className="py-8 sm:py-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 font-display text-sm font-bold text-white/85 transition hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Voltar para o blog
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center">
              <div>
                <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
                  Blog CCMF
                </p>
                <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-4 max-w-2xl text-white/90 sm:text-lg">{post.excerpt}</p>

                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-white/85">
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt.toISOString()}>
                      {formatPostDate(post.publishedAt)}
                    </time>
                  )}
                  <span>{readingMinutes} min de leitura</span>
                  {post.author?.name && <span>Por {post.author.name}</span>}
                </div>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden rounded-bubble bg-white/10 shadow-brand-lg">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={`Imagem de capa: ${post.title}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-5xl font-extrabold">
                    CCMF
                  </div>
                )}
              </div>
            </div>
          </Container>
        </header>

        <section className="py-10 sm:py-14">
          <Container className="max-w-3xl">
            <BlogMarkdown content={post.content} />
          </Container>
        </section>
      </article>

      <section className="bg-surface-muted py-12 sm:py-16">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-700">
                Continue lendo
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-primary-700 sm:text-3xl">
                Mais conteúdos do blog
              </h2>
            </div>
            <Button href="/blog" variant="outline" size="sm">
              Ver todos
            </Button>
          </div>

          {recentPosts.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((recentPost) => (
                <BlogCard key={recentPost.slug} post={toBlogCardData(recentPost)} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-bubble bg-white p-6 text-center text-ink-muted shadow-brand">
              Novos artigos serão publicados em breve.
            </div>
          )}
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

import { CalendarDays, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/ui";

export type BlogCardData = {
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: Date | null;
  authorName: string | null;
  readingMinutes: number;
};

export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogCardData;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group block overflow-hidden rounded-bubble bg-white shadow-brand transition hover:-translate-y-1 hover:shadow-brand-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
        featured && "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]",
      )}
    >
      <div className={cn("relative aspect-[16/10] bg-primary-50", featured && "lg:aspect-auto")}>
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt={`Imagem de capa: ${post.title}`}
            fill
            sizes={
              featured
                ? "(min-width: 1024px) 45vw, 100vw"
                : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-gradient text-center font-display text-4xl font-extrabold text-white">
            CCMF
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-accent-700 shadow-sm backdrop-blur">
          Blog
        </span>
      </div>

      <article className={cn("p-5 sm:p-6", featured && "lg:p-8")}>
        <PostMeta post={post} />
        <h2
          className={cn(
            "mt-3 text-balance font-display text-2xl font-extrabold leading-tight text-primary-700 group-hover:text-accent-700",
            featured && "sm:text-3xl",
          )}
        >
          {post.title}
        </h2>
        <p className={cn("mt-3 text-sm/6 text-ink-muted", featured && "sm:text-base/7")}>
          {post.excerpt}
        </p>
        <span className="mt-5 inline-flex font-display text-sm font-bold text-accent-700">
          Ler artigo
        </span>
      </article>
    </Link>
  );
}

function PostMeta({ post }: { post: BlogCardData }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {post.publishedAt && (
        <time dateTime={post.publishedAt.toISOString()} className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-accent-600" aria-hidden />
          {formatPostDate(post.publishedAt)}
        </time>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5 text-accent-600" aria-hidden />
        {post.readingMinutes} min de leitura
      </span>
      {post.authorName && <span>Por {post.authorName}</span>}
    </div>
  );
}

export function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

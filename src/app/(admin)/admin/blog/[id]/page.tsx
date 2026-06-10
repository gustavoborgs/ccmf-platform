import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/modules/blog/components/blog-post-form";
import { getAdminBlogPostById } from "@/modules/blog/service";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card } from "@/shared/ui";

export default async function AdminBlogPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/blog"
            className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
          >
            ← Voltar para o blog
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-primary-700">{post.title}</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Edite conteúdo, capa, slug e visibilidade deste artigo.
          </p>
        </div>
        {post.publishedAt && post.publishedAt <= new Date() && (
          <Button href={`/blog/${post.slug}`} variant="outline" target="_blank" rel="noopener noreferrer">
            Ver no site
          </Button>
        )}
      </section>

      <Card className="p-5 sm:p-6">
        <BlogPostForm
          initial={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverKey: post.coverKey,
            coverUrl: post.coverKey ? getPublicUrl(post.coverKey) : null,
            publishedAt: post.publishedAt,
          }}
        />
      </Card>
    </div>
  );
}

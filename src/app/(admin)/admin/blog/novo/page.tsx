import Link from "next/link";
import { BlogPostForm } from "@/modules/blog/components/blog-post-form";
import { Card } from "@/shared/ui";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/blog"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para o blog
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Novo post</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Escreva um conteúdo estratégico para responsáveis, com resumo pensado para SEO e capa
          otimizada para mobile e compartilhamentos.
        </p>
      </section>

      <Card className="p-5 sm:p-6">
        <BlogPostForm />
      </Card>
    </div>
  );
}

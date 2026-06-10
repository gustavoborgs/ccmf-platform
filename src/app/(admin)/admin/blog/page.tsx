import Image from "next/image";
import { listAdminBlogPosts } from "@/modules/blog/service";
import { adminBlogFiltersSchema, BLOG_VISIBILITIES } from "@/modules/blog/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import {
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import { formatDateTime, StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminBlogRow = Awaited<ReturnType<typeof listAdminBlogPosts>>["items"][number];

const visibilityLabels: Record<(typeof BLOG_VISIBILITIES)[number], string> = {
  published: "Publicado",
  scheduled: "Agendado",
  draft: "Rascunho",
};

const columns: DataTableColumn<AdminBlogRow>[] = [
  {
    id: "cover",
    header: "Capa",
    headClassName: "w-36",
    cell: (post) =>
      post.coverKey ? (
        <Image
          src={getPublicUrl(post.coverKey)}
          alt=""
          width={120}
          height={75}
          className="aspect-[16/10] rounded-2xl border border-primary-100 object-cover"
        />
      ) : (
        <div className="flex aspect-[16/10] w-[120px] items-center justify-center rounded-2xl bg-primary-50 font-display text-lg font-extrabold text-primary-200">
          CCMF
        </div>
      ),
  },
  {
    id: "post",
    header: "Post",
    cell: (post) => (
      <div className="min-w-64">
        <p className="font-display text-lg font-extrabold text-primary-700">{post.title}</p>
        <p className="max-w-xl truncate text-sm text-ink-muted">{post.excerpt}</p>
        <p className="mt-1 text-xs font-semibold text-ink-muted">/blog/{post.slug}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (post) => <PostStatusBadge publishedAt={post.publishedAt} />,
  },
  {
    id: "publishedAt",
    header: "Publicação",
    cell: (post) => formatDateTime(post.publishedAt),
  },
  {
    id: "updatedAt",
    header: "Atualizado",
    cell: (post) => formatDateTime(post.updatedAt),
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-32",
    cellClassName: "text-right",
    cell: (post) => (
      <Button href={`/admin/blog/${post.id}`} variant="outline" size="sm">
        Editar
      </Button>
    ),
  },
];

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminBlogFiltersSchema.parse(await searchParams);
  const { items: posts, pagination } = await listAdminBlogPosts(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "visibility",
      label: "Visibilidade",
      options: BLOG_VISIBILITIES.map((visibility) => ({
        value: visibility,
        label: visibilityLabels[visibility],
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Site
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Blog</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Gerencie artigos publicados, rascunhos e posts agendados. Use títulos claros, resumo
            estratégico e capa forte para melhorar SEO e compartilhamento.
          </p>
        </div>
        <Button href="/admin/blog/novo">Novo post</Button>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Buscar por título, slug ou resumo" filters={tableFilters} />
        <DataTable
          columns={columns}
          rows={posts}
          rowKey={(post) => post.id}
          emptyMessage="Nenhum post encontrado. Crie o primeiro em “Novo post”."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

function PostStatusBadge({ publishedAt }: { publishedAt: Date | null }) {
  if (!publishedAt) return <StatusBadge tone="neutral">Rascunho</StatusBadge>;
  if (publishedAt > new Date()) return <StatusBadge tone="info">Agendado</StatusBadge>;
  return <StatusBadge tone="success">Publicado</StatusBadge>;
}

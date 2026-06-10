import Image from "next/image";
import { listAdminVideos } from "@/modules/content/service";
import { adminVideoFiltersSchema, VIDEO_VISIBILITIES } from "@/modules/content/validators";
import { getYoutubeThumbnailUrl } from "@/modules/content/youtube";
import {
  Button,
  Card,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableFilter,
} from "@/shared/ui";
import { StatusBadge } from "../_components/admin-ui";

type SearchParams = Record<string, string | string[] | undefined>;
type AdminVideoRow = Awaited<ReturnType<typeof listAdminVideos>>["items"][number];

const visibilityLabels: Record<(typeof VIDEO_VISIBILITIES)[number], string> = {
  published: "Publicado",
  draft: "Rascunho",
};

const columns: DataTableColumn<AdminVideoRow>[] = [
  {
    id: "thumbnail",
    header: "Imagem",
    headClassName: "w-36",
    cell: (video) => {
      const thumbnailUrl = getYoutubeThumbnailUrl(video.youtubeUrl);
      return thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt=""
          width={120}
          height={90}
          className="rounded-2xl border border-primary-100 object-cover"
        />
      ) : (
        <div className="h-[90px] w-[120px] rounded-2xl bg-primary-50" />
      );
    },
  },
  {
    id: "video",
    header: "Vídeo",
    cell: (video) => (
      <div>
        <p className="font-display text-lg font-extrabold text-primary-700">{video.title}</p>
        <p className="max-w-xl truncate text-sm text-ink-muted">{video.youtubeUrl}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (video) => (
      <StatusBadge tone={video.published ? "success" : "neutral"}>
        {video.published ? "Publicado" : "Rascunho"}
      </StatusBadge>
    ),
  },
  {
    id: "order",
    header: "Ordem",
    cell: (video) => video.order,
  },
  {
    id: "actions",
    header: "",
    headClassName: "w-32",
    cellClassName: "text-right",
    cell: (video) => (
      <Button href={`/admin/videos/${video.id}`} variant="outline" size="sm">
        Editar
      </Button>
    ),
  },
];

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = adminVideoFiltersSchema.parse(await searchParams);
  const { items: videos, pagination } = await listAdminVideos(filters);

  const tableFilters: DataTableFilter[] = [
    {
      id: "visibility",
      label: "Visibilidade",
      options: VIDEO_VISIBILITIES.map((visibility) => ({
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
          <h1 className="mt-2 text-3xl font-extrabold text-primary-700">Vídeos</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">
            Gerencie a vitrine pública de vídeos do YouTube. A plataforma guarda a URL original e
            monta automaticamente a imagem de capa e o embed.
          </p>
        </div>
        <Button href="/admin/videos/novo">Novo vídeo</Button>
      </section>

      <Card className="overflow-hidden p-0">
        <DataTableToolbar searchPlaceholder="Buscar por título ou URL" filters={tableFilters} />
        <DataTable
          columns={columns}
          rows={videos}
          rowKey={(video) => video.id}
          emptyMessage="Nenhum vídeo encontrado. Crie o primeiro em “Novo vídeo”."
        />
        <DataTablePagination pagination={pagination} />
      </Card>
    </div>
  );
}

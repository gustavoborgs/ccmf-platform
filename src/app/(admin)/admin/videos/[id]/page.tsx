import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoForm } from "@/modules/content/components/video-form";
import { getAdminVideoById } from "@/modules/content/service";
import { Card } from "@/shared/ui";

export default async function AdminVideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getAdminVideoById(id);
  if (!video) notFound();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/videos"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para vídeos
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">{video.title}</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Edite título, URL, ordem e publicação deste vídeo na vitrine pública.
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <VideoForm
          initial={{
            id: video.id,
            title: video.title,
            youtubeUrl: video.youtubeUrl,
            order: video.order,
            published: video.published,
          }}
        />
      </Card>
    </div>
  );
}

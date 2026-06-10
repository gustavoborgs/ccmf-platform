import Link from "next/link";
import { VideoForm } from "@/modules/content/components/video-form";
import { Card } from "@/shared/ui";

export default function NewVideoPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/videos"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para vídeos
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Novo vídeo</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Cadastre a URL do YouTube para exibir o vídeo na vitrine pública. A imagem de capa é
          gerada automaticamente a partir do ID do vídeo.
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <VideoForm />
      </Card>
    </div>
  );
}

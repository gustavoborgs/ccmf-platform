import type { Metadata } from "next";
import { VideoGallery } from "@/modules/content/components/video-gallery";
import { listVideos } from "@/modules/content/service";
import { Button, Card, Container, SectionHeading } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Vídeos",
  description:
    "Assista aos vídeos do Concurso Criança Mais Fotogênica e acompanhe chamadas, bastidores e conteúdos oficiais.",
};

export default async function VideosPage() {
  const videos = await listVideos();

  return (
    <>
      <section className="bg-brand-gradient text-white">
        <Container className="py-20 lg:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
            Vídeos
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Chamadas e momentos do Concurso Criança Mais Fotogênica
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Uma vitrine com conteúdos oficiais, chamadas de participação e registros que ajudam as
            famílias a conhecerem melhor o concurso.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading
            kicker="Assista"
            title="Vídeos em destaque"
            description="Os vídeos publicados pela organização aparecem aqui em ordem de destaque."
          />

          {videos.length > 0 ? (
            <VideoGallery videos={videos} />
          ) : (
            <Card className="mx-auto mt-12 max-w-2xl text-center">
              <h2 className="font-display text-2xl font-extrabold text-primary-700">
                Nenhum vídeo publicado ainda
              </h2>
              <p className="mt-3 text-ink-muted">
                Em breve, os conteúdos oficiais do concurso estarão disponíveis nesta página.
              </p>
            </Card>
          )}
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="rounded-bubble bg-surface-muted px-6 py-12 text-center sm:px-10">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-700">
              Quer participar?
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold text-primary-700 sm:text-4xl">
              Inscreva sua criança na edição atual
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
              Depois da inscrição, acompanhe as próximas etapas pela plataforma e pelos canais
              oficiais.
            </p>
            <Button href="/inscricao" size="lg" className="mt-8">
              Começar inscrição
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

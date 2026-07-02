import { notFound } from "next/navigation";
import { requireRole } from "@/modules/auth/guards";
import { getTrainingAccess } from "@/modules/registrations/service";
import {
  getAdjacentChapters,
  getChapterBySlug,
  getModuleIndex,
  isFreeChapter,
} from "@/modules/academy/service";
import {
  AcademyRenderer,
  ChapterHero,
  ChapterNav,
  LockedChapter,
  ReadingProgress,
} from "@/modules/academy/components";
import { Button, Container } from "@/shared/ui";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Leitura de capítulo do treinamento premium.
 * Capítulos fora do módulo gratuito exigem inscrição paga na edição ativa.
 * Spec: docs/modules/academy.md
 */
export default async function AcademyChapterPage({ params }: PageProps) {
  const user = await requireRole("GUARDIAN");
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const modules = getModuleIndex();
  const trainingModule = modules.find((item) => item.slug === chapter.moduleSlug);
  const moduleTitle = trainingModule?.title ?? "Treinamento";

  if (!isFreeChapter(slug)) {
    const { hasAccess, registrationFeeCents } = await getTrainingAccess(user.id);

    if (!hasAccess) {
      return (
        <Container className="py-12">
          <div className="mb-6">
            <Button href="/conta/formacao" variant="ghost" size="sm">
              ← Índice do treinamento
            </Button>
          </div>

          <LockedChapter
            chapterTitle={chapter.title}
            moduleTitle={moduleTitle}
            registrationFeeCents={registrationFeeCents}
          />
        </Container>
      );
    }
  }

  const { previous, next } = getAdjacentChapters(slug);

  return (
    <>
      <ReadingProgress />
      <Container className="py-12">
        <div className="mb-6">
          <Button href="/conta/formacao" variant="ghost" size="sm">
            ← Índice do treinamento
          </Button>
        </div>

        <ChapterHero
          chapterNumber={chapter.chapterNumber}
          title={chapter.title}
          subtitle={chapter.subtitle}
          cover={chapter.cover}
          readingMinutes={chapter.readingMinutes}
          moduleTitle={moduleTitle}
        />

        <article className="mx-auto mt-10 max-w-3xl">
          <AcademyRenderer blocks={chapter.blocks} />
        </article>

        <div className="mx-auto mt-12 max-w-3xl">
          <ChapterNav previous={previous} next={next} />
        </div>
      </Container>
    </>
  );
}

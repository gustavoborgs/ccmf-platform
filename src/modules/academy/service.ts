import type { AcademyChapter, ModuleWithChapters, TrainingMeta } from "./types";
import { getTrainingCoverPath } from "./visual-assets";
import { chapters, modules } from "./content";

/**
 * Treinamento Academy — leitura premium na área do responsável.
 * Spec: docs/modules/academy.md
 */

export function getTrainingMeta(): TrainingMeta {
  const totalReadingMinutes = chapters.reduce((sum, chapter) => sum + chapter.readingMinutes, 0);

  return {
    title: "Como Gerenciar a Carreira do Seu Filho",
    subtitle:
      "Formação completa para pais e mães que querem conduzir o talento da criança com método, ética e segurança",
    author: "Claudia Cavalcante",
    authorRole: "Fotógrafa e idealizadora do Concurso Criança Mais Fotogênica do Brasil",
    cover: getTrainingCoverPath(),
    description:
      "27 capítulos práticos para você sair do 'e agora?' e passar a gerir a jornada do seu filho com clareza: mercado, dinheiro, contratos, imagem, negociação e plano de 90 dias. Sem promessa de fama. Com proteção real da infância.",
    totalChapters: chapters.length,
    totalReadingMinutes,
  };
}

export function listChapters(): AcademyChapter[] {
  return [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export function getChapterBySlug(slug: string): AcademyChapter | undefined {
  return chapters.find((chapter) => chapter.slug === slug);
}

export function getModuleIndex(): ModuleWithChapters[] {
  return modules
    .map((module) => ({
      ...module,
      chapters: listChapters()
        .filter((chapter) => chapter.moduleSlug === module.slug)
        .map(({ slug, chapterNumber, title, readingMinutes }) => ({
          slug,
          chapterNumber,
          title,
          readingMinutes,
        })),
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Módulos liberados como degustação para quem ainda não tem inscrição paga.
 * Os demais ficam bloqueados até a confirmação do pagamento (docs/modules/academy.md).
 */
export const FREE_MODULE_SLUGS: readonly string[] = ["welcome"];

export function isFreeChapter(slug: string): boolean {
  const chapter = getChapterBySlug(slug);
  return Boolean(chapter && FREE_MODULE_SLUGS.includes(chapter.moduleSlug));
}

export function getAdjacentChapters(slug: string): {
  previous: AcademyChapter | null;
  next: AcademyChapter | null;
} {
  const ordered = listChapters();
  const index = ordered.findIndex((chapter) => chapter.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}


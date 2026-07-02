/**
 * Tipos do treinamento Academy — blocos editoriais tipados.
 * Spec: docs/modules/academy.md
 */

export type HeadingBlock = {
  type: "heading";
  level: 2 | 3;
  text: string;
};

export type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type ListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

export type TableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

export type CaseStudyBlock = {
  type: "caseStudy";
  title: string;
  body: string;
  takeaway: string;
};

export type AlertBlock = {
  type: "alert";
  title: string;
  body: string;
};

export type ExerciseBlock = {
  type: "exercise";
  title: string;
  steps: string[];
};

export type QuoteBlock = {
  type: "quote";
  text: string;
};

export type ChecklistBlock = {
  type: "checklist";
  items: string[];
};

export type ImageBlock = {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
};

export type TakeawaysBlock = {
  type: "takeaways";
  items: string[];
};

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | CaseStudyBlock
  | AlertBlock
  | ExerciseBlock
  | QuoteBlock
  | ChecklistBlock
  | ImageBlock
  | TakeawaysBlock;

export type AcademyModule = {
  slug: string;
  order: number;
  title: string;
  description: string;
  cover: string;
};

export type AcademyChapter = {
  slug: string;
  moduleSlug: string;
  moduleOrder: number;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  cover: string;
  readingMinutes: number;
  blocks: ContentBlock[];
};

export type TrainingMeta = {
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  cover: string;
  description: string;
  totalChapters: number;
  totalReadingMinutes: number;
};

export type ModuleWithChapters = AcademyModule & {
  chapters: Pick<AcademyChapter, "slug" | "chapterNumber" | "title" | "readingMinutes">[];
};

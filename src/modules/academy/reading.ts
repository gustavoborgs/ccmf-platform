import type { AcademyChapter, ContentBlock } from "./types";

const WORDS_PER_MINUTE = 180;

export function estimateReadingMinutes(blocks: ContentBlock[]): number {
  const text = blocks
    .flatMap((block) => {
      switch (block.type) {
        case "heading":
          return [block.text];
        case "paragraph":
          return [block.text];
        case "list":
          return block.items;
        case "caseStudy":
          return [block.title, block.body, block.takeaway];
        case "alert":
          return [block.title, block.body];
        case "exercise":
          return [block.title, ...block.steps];
        case "quote":
          return [block.text];
        case "checklist":
          return block.items;
        case "takeaways":
          return block.items;
        case "table":
          return [...block.headers, ...block.rows.flat()];
        case "image":
          return block.caption ? [block.caption] : [];
        default:
          return [];
      }
    })
    .join(" ");

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function withReadingMinutes(chapter: Omit<AcademyChapter, "readingMinutes">): AcademyChapter {
  return {
    ...chapter,
    readingMinutes: estimateReadingMinutes(chapter.blocks),
  };
}

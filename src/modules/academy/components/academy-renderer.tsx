import Image from "next/image";
import type { ReactNode } from "react";
import type { ContentBlock } from "../types";
import { AlertBox } from "./alert-box";
import { CaseStudyCard } from "./case-study-card";
import { Checklist } from "./checklist";
import { ClaudiaQuote } from "./claudia-quote";
import { ExerciseBox } from "./exercise-box";
import { Takeaways } from "./takeaways";

type AcademyRendererProps = {
  blocks: ContentBlock[];
};

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Renderiza blocos editoriais tipados do treinamento. */
export function AcademyRenderer({ blocks }: AcademyRendererProps) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 2 ? "h2" : "h3";
      const className =
        block.level === 2
          ? "pt-2 font-display text-2xl font-extrabold text-primary-700"
          : "pt-4 font-display text-xl font-extrabold text-primary-700";

      return (
        <Tag key={index} className={className}>
          {block.text}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p key={index} className="text-base/8 text-ink-muted">
          {renderInline(block.text)}
        </p>
      );

    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      const listClassName = block.ordered
        ? "list-decimal space-y-2 pl-6 text-ink-muted marker:font-bold marker:text-accent-600"
        : "list-disc space-y-2 pl-6 text-ink-muted marker:text-accent-600";

      return (
        <ListTag key={index} className={listClassName}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="text-base/8">
              {renderInline(item)}
            </li>
          ))}
        </ListTag>
      );
    }

    case "table":
      return (
        <div key={index} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full divide-y divide-primary-100 rounded-3xl border border-primary-100 bg-white text-left text-sm shadow-sm">
            <thead className="bg-primary-50 text-primary-700">
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={headerIndex} className="px-5 py-3 font-display text-sm font-bold">
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100 text-ink-muted">
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-4 align-top text-sm/6">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "caseStudy":
      return (
        <CaseStudyCard
          key={index}
          title={block.title}
          body={block.body}
          takeaway={block.takeaway}
        />
      );

    case "alert":
      return <AlertBox key={index} title={block.title} body={block.body} />;

    case "exercise":
      return <ExerciseBox key={index} title={block.title} steps={block.steps} />;

    case "quote":
      return <ClaudiaQuote key={index} text={block.text} />;

    case "checklist":
      return <Checklist key={index} items={block.items} />;

    case "image":
      return (
        <figure key={index} className="overflow-hidden rounded-bubble border border-primary-100 bg-white shadow-sm">
          <div className="relative aspect-[16/10] w-full bg-surface-muted">
            <Image
              src={block.src}
              alt={block.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 48rem, 100vw"
            />
          </div>
          {block.caption && (
            <figcaption className="px-4 py-3 text-center text-sm text-ink-muted">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "takeaways":
      return <Takeaways key={index} items={block.items} />;

    default:
      return null;
  }
}

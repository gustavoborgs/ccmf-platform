import type { ReactNode } from "react";

type HeadingBlock = {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

type ListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

type TableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

type MarkdownBlock = HeadingBlock | ParagraphBlock | ListBlock | TableBlock;

export function BlogMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-6 text-lg/8 text-ink">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: MarkdownBlock, index: number) {
  if (block.type === "heading") {
    const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3";
    const className =
      block.level === 1
        ? "pt-2 font-display text-3xl font-extrabold text-primary-700"
        : "pt-6 font-display text-2xl font-extrabold text-primary-700";

    return (
      <HeadingTag key={index} className={className}>
        {renderInline(block.text)}
      </HeadingTag>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    const listClassName = block.ordered
      ? "list-decimal space-y-3 pl-6 text-ink-muted marker:font-bold marker:text-accent-600"
      : "list-disc space-y-3 pl-6 text-ink-muted marker:text-accent-600";

    return (
      <ListTag key={index} className={listClassName}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "table") {
    return (
      <div key={index} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="min-w-full divide-y divide-primary-100 rounded-3xl border border-primary-100 bg-white text-left text-sm shadow-sm">
          <thead className="bg-primary-50 text-primary-700">
            <tr>
              {block.headers.map((header, headerIndex) => (
                <th key={headerIndex} className="px-5 py-3 font-display text-base font-bold">
                  {renderInline(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100 text-ink-muted">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-4 align-top">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <p key={index} className="text-ink-muted">
      {renderInline(block.text)}
    </p>
  );
}

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const tableLines: string[] = [];

      while (index < lines.length && isTableRow(lines[index] ?? "")) {
        tableLines.push(lines[index] ?? "");
        index += 1;
      }

      const [headerLine, , ...rowLines] = tableLines;
      blocks.push({
        type: "table",
        headers: parseTableCells(headerLine),
        rows: rowLines.map(parseTableCells),
      });
      continue;
    }

    const listItem = parseListItem(line);
    if (listItem) {
      const items: string[] = [];
      const ordered = listItem.ordered;

      while (index < lines.length) {
        const currentItem = parseListItem(lines[index]?.trim() ?? "");
        if (!currentItem || currentItem.ordered !== ordered) break;

        items.push(currentItem.text);
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const currentLine = lines[index]?.trim() ?? "";

      if (
        !currentLine ||
        currentLine.startsWith("#") ||
        parseListItem(currentLine) ||
        isTableStart(lines, index)
      ) {
        break;
      }

      paragraphLines.push(currentLine);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function parseListItem(line: string) {
  const unordered = line.match(/^[-*]\s+(.+)$/);
  if (unordered) return { ordered: false, text: unordered[1] };

  const ordered = line.match(/^\d+\.\s+(.+)$/);
  if (ordered) return { ordered: true, text: ordered[1] };

  return null;
}

function isTableStart(lines: string[], index: number) {
  return isTableRow(lines[index] ?? "") && isTableSeparator(lines[index + 1] ?? "");
}

function isTableRow(line: string) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableSeparator(line: string) {
  return /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
}

function parseTableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

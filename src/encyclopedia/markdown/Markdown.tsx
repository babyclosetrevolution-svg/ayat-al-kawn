import type { ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer.
 *
 * Supported syntax — intentionally narrow, encyclopedia content is
 * authored against this subset:
 *   # / ## / ### / #### headings
 *   - / * unordered list items (single level)
 *   1. ordered list items (single level)
 *   > blockquote line
 *   ``` fenced code blocks
 *   `inline code`
 *   **bold**, *italic*, _italic_
 *   [text](url) links
 *   blank line = paragraph break
 *
 * Output is plain JSX styled with Tailwind utility classes that match
 * the rest of the Knowledge Panel. We deliberately avoid the heavier
 * markdown-it / remark stack: encyclopedia bodies stay small and
 * predictable, and the bundle stays light.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Fenced code block.
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    // Blank.
    if (!line.trim()) {
      i++;
      continue;
    }
    // Heading.
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({
        kind: "heading",
        level: h[1].length as 1 | 2 | 3 | 4,
        text: h[2].trim(),
      });
      i++;
      continue;
    }
    // Blockquote.
    if (/^>\s?/.test(line)) {
      const buf: string[] = [line.replace(/^>\s?/, "")];
      i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }
    // Unordered list.
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    // Ordered list.
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    // Paragraph (consume until blank/heading/list/quote/fence).
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: buf.join(" ") });
  }
  return blocks;
}

/** Render inline syntax (links, bold, italic, code) inside one string. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Token order matters: code → link → bold → italic.
  const pattern =
    /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const tok = m[0];
    const key = `${keyBase}-${idx++}`;
    if (tok.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.78em] text-sky-100"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
            className="text-sky-300 underline decoration-sky-300/40 underline-offset-2 hover:text-sky-200"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    } else if (tok.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-medium text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={key} className="italic text-white/85">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-3 text-[0.9rem] font-light leading-relaxed text-white/80">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading": {
            const sizes = {
              1: "text-xl font-light text-white mt-2",
              2: "text-lg font-light text-white mt-2",
              3: "text-base font-medium text-white/95 mt-1",
              4: "text-sm font-medium uppercase tracking-[0.2em] text-white/70 mt-1",
            } as const;
            const Tag = (`h${b.level}` as unknown) as keyof JSX.IntrinsicElements;
            return (
              <Tag key={i} className={sizes[b.level]}>
                {renderInline(b.text, `h-${i}`)}
              </Tag>
            );
          }
          case "paragraph":
            return <p key={i}>{renderInline(b.text, `p-${i}`)}</p>;
          case "ul":
            return (
              <ul
                key={i}
                className="ml-4 list-disc space-y-1 marker:text-white/30"
              >
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ul-${i}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="ml-4 list-decimal space-y-1 marker:text-white/40"
              >
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `ol-${i}-${j}`)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-sky-400/40 pl-3 italic text-white/70"
              >
                {renderInline(b.text, `q-${i}`)}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[0.78rem] text-sky-100"
              >
                <code>{b.text}</code>
              </pre>
            );
        }
      })}
    </div>
  );
}

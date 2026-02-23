function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text: string): string {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return html;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const paragraph = paragraphBuffer.join(" ").trim();
    if (paragraph) output.push(`<p>${formatInline(paragraph)}</p>`);
    paragraphBuffer = [];
  };

  const closeList = () => {
    if (inList) {
      output.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine ?? "";
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      closeList();
      if (!inCodeBlock) {
        output.push("<pre><code>");
        inCodeBlock = true;
      } else {
        output.push("</code></pre>");
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      if (!inList) {
        output.push("<ul>");
        inList = true;
      }
      output.push(`<li>${formatInline(listMatch[1])}</li>`);
      continue;
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${formatInline(blockquoteMatch[1])}</blockquote>`);
      continue;
    }

    closeList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();

  if (inCodeBlock) {
    output.push("</code></pre>");
  }

  return output.join("\n");
}

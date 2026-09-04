export type ArticleBlock =
  | { type: "heading" | "paragraph"; text: string }
  | { type: "quote"; text: string; source: string };

// Plain text stays plain text: no raw HTML or arbitrary embedded content.
export function parseArticleContent(content: string): ArticleBlock[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((block) => block.trim())
    .map((block) => {
      if (block.startsWith("## "))
        return { type: "heading", text: block.slice(3).trim() };
      const lines = block.split("\n");
      if (lines.every((line) => line.startsWith(">"))) {
        const quote = lines.map((line) => line.replace(/^> ?/, ""));
        const last = quote[quote.length - 1];
        const source = last.startsWith("Source: ")
          ? quote.pop()!.slice(8).trim()
          : "";
        return { type: "quote", text: quote.join("\n"), source };
      }
      return { type: "paragraph", text: block };
    });
}

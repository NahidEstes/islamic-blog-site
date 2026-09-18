import { describe, expect, it } from "vitest";
import {
  estimateArticleReadingTime,
  extractArticleText,
  prepareArticleContent,
  sanitizeArticleHtml
} from "../lib/article-html";
import { plainArticleToRichHtml } from "../lib/article-content";
import { ArticleBody } from "../components/ArticleBody";

describe("rich article HTML security", () => {
  it("removes executable markup, event handlers, styles, images, and unsafe URLs", () => {
    const clean = sanitizeArticleHtml(`
      <style>.hidden { display:none }</style>
      <script>alert(1)</script>
      <p class="source" style="color:red" onclick="alert(1)">Safe text</p>
      <a href="javascript:alert(1)" onmouseover="alert(1)">Unsafe link</a>
      <img src="data:image/png;base64,AAAA" onerror="alert(1)">
      <iframe src="https://example.com"></iframe>
    `);
    expect(clean).toContain("<p>Safe text</p>");
    expect(clean).toContain("Unsafe link");
    expect(clean).not.toMatch(
      /script|style=|onclick|onmouseover|javascript:|data:|img|iframe/i
    );
  });

  it("keeps allowed semantic headings, lists, quotes, safe links, code, and tables", () => {
    const clean = sanitizeArticleHtml(`
      <h2>Heading</h2><h3>Subheading</h3>
      <p><strong>Bold</strong> <em>italic</em> <u>underlined</u></p>
      <ul><li>One<ol><li>Nested</li></ol></li></ul>
      <blockquote><p>Test-only quotation</p></blockquote>
      <a href="https://example.com/path">Source</a>
      <pre><code>const safe = true;</code></pre>
      <table><thead><tr><th scope="col">Name</th></tr></thead><tbody><tr><td colspan="2">Value</td></tr></tbody></table>
    `);
    expect(clean).toContain("<h2>Heading</h2>");
    expect(clean).toContain("<ol><li>Nested</li></ol>");
    expect(clean).toContain(
      "<blockquote><p>Test-only quotation</p></blockquote>"
    );
    expect(clean).toContain(
      '<a href="https://example.com/path" target="_blank" rel="noopener noreferrer">Source</a>'
    );
    expect(clean).toContain("<pre><code>const safe = true;</code></pre>");
    expect(clean).toContain('<th scope="col">Name</th>');
    expect(clean).toContain('<td colspan="2">Value</td>');
  });

  it("enforces limits after sanitization and derives visible search text", () => {
    const prepared = prepareArticleContent(
      "<h2>Visible heading</h2><p>Words &amp; more words for the searchable article body.</p>",
      "rich-html"
    );
    expect(prepared.visibleText).toBe(
      "Visible heading Words & more words for the searchable article body."
    );
    expect(prepared.tooShort).toBe(false);
    expect(extractArticleText("<p>one two three</p>", "rich-html")).toBe(
      "one two three"
    );
    expect(
      estimateArticleReadingTime(
        `<p>${Array.from({ length: 221 }, () => "word").join(" ")}</p>`,
        "rich-html"
      )
    ).toBe(2);
  });
});

describe("article format compatibility", () => {
  it("keeps legacy plain-text rendering", () => {
    const rendered = ArticleBody({
      content: "## Legacy heading\n\nLegacy paragraph",
      contentFormat: "plain"
    }) as unknown as { props: { children: Array<{ type: string }> } };
    expect(rendered.props.children.map((child) => child.type)).toEqual([
      "h2",
      "p"
    ]);
  });

  it("sanitizes rich-text rendering again", () => {
    const rendered = ArticleBody({
      content: '<h2>Rich heading</h2><p onclick="bad()">Body</p>',
      contentFormat: "rich-html"
    }) as unknown as {
      props: { dangerouslySetInnerHTML: { __html: string } };
    };
    expect(rendered.props.dangerouslySetInnerHTML.__html).toBe(
      "<h2>Rich heading</h2><p>Body</p>"
    );
  });

  it("converts legacy syntax only when explicitly requested", () => {
    expect(
      plainArticleToRichHtml(
        "## Legacy heading\n\nParagraph\n\n> Test-only quote\n> Source: Test fixture"
      )
    ).toBe(
      "<h2>Legacy heading</h2><p>Paragraph</p><blockquote><p>Test-only quote</p><p><em>— Test fixture</em></p></blockquote>"
    );
  });
});

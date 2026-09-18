import sanitizeHtml from "sanitize-html";

export type ArticleContentFormat = "plain" | "rich-html";

export const ARTICLE_CONTENT_MAX_LENGTH = 100_000;
export const ARTICLE_VISIBLE_TEXT_MIN_LENGTH = 50;

const allowedTags = [
  "p",
  "br",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "hr",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td"
];

function safeCellAttributes(attributes: sanitizeHtml.Attributes) {
  const clean: sanitizeHtml.Attributes = {};
  for (const name of ["colspan", "rowspan"] as const) {
    const value = attributes[name];
    if (value && /^\d{1,2}$/.test(value) && Number(value) > 0)
      clean[name] = String(Math.min(Number(value), 20));
  }
  if (
    attributes.scope &&
    ["col", "row", "colgroup", "rowgroup"].includes(attributes.scope)
  )
    clean.scope = attributes.scope;
  return clean;
}

export function sanitizeArticleHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan", "scope"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    parseStyleAttributes: false,
    transformTags: {
      a: (_tagName, attributes) => {
        const href = String(attributes.href ?? "").trim();
        const external = /^https?:\/\//i.test(href);
        return {
          tagName: "a",
          attribs: {
            ...(href ? { href } : {}),
            ...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})
          }
        };
      },
      th: (_tagName, attributes) => ({
        tagName: "th",
        attribs: safeCellAttributes(attributes)
      }),
      td: (_tagName, attributes) => ({
        tagName: "td",
        attribs: safeCellAttributes(attributes)
      })
    }
  }).trim();
}

function decodeTextEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, code: string) => {
      if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
      const number =
        code[1]?.toLowerCase() === "x"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(number) && number >= 0 && number <= 0x10ffff
        ? String.fromCodePoint(number)
        : entity;
    }
  );
}

export function extractArticleText(
  content: string,
  format: ArticleContentFormat = "plain"
) {
  if (format === "plain") return content.replace(/\s+/g, " ").trim();
  const clean = sanitizeArticleHtml(content).replace(
    /<\/?(?:p|h[2-4]|li|blockquote|pre|tr|th|td|br|hr)\b[^>]*>/gi,
    " "
  );
  const text = sanitizeHtml(clean, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard"
  });
  return decodeTextEntities(text).replace(/\s+/g, " ").trim();
}

export function prepareArticleContent(
  content: string,
  format: ArticleContentFormat
) {
  const storedContent =
    format === "rich-html" ? sanitizeArticleHtml(content) : content.trim();
  const visibleText = extractArticleText(storedContent, format);
  return {
    content: storedContent,
    visibleText,
    tooShort: visibleText.length < ARTICLE_VISIBLE_TEXT_MIN_LENGTH,
    tooLong: storedContent.length > ARTICLE_CONTENT_MAX_LENGTH
  };
}

export function estimateArticleReadingTime(
  content: string,
  format: ArticleContentFormat = "plain"
) {
  const text = extractArticleText(content, format);
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 220));
}

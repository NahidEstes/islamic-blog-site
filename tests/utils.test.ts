import { describe, expect, it } from "vitest";
import { slugify } from "../lib/utils";
import { estimateArticleReadingTime } from "../lib/article-html";
import { articleSchema, contactSchema, loginSchema } from "../lib/validation";

describe("content utilities", () => {
  it("creates predictable slugs", () =>
    expect(slugify("  Clear & Useful Title  ")).toBe("clear-useful-title"));
  it("never returns a zero-minute reading time", () =>
    expect(estimateArticleReadingTime("short")).toBe(1));
});

describe("validation", () => {
  it("normalizes email addresses", () =>
    expect(
      loginSchema.parse({ email: "TEST@EXAMPLE.COM", password: "password123" })
        .email
    ).toBe("test@example.com"));
  it("rejects short article content", () =>
    expect(
      articleSchema.safeParse({
        title: "Valid title",
        excerpt: "A sufficiently long article excerpt.",
        content: "Too short",
        category: "Knowledge"
      }).success
    ).toBe(false));
  it("normalizes an explicitly entered article slug", () => {
    const result = articleSchema.parse({
      title: "A valid article title",
      slug: "  A Custom Article Slug  ",
      excerpt: "A sufficiently long article excerpt.",
      content:
        "This is sufficiently long article content used only for validating the article slug field.",
      category: "Knowledge"
    });
    expect(result.slug).toBe("a-custom-article-slug");
  });
  it("rejects a slug without letters or numbers", () =>
    expect(
      articleSchema.safeParse({
        title: "A valid article title",
        slug: "---",
        excerpt: "A sufficiently long article excerpt.",
        content:
          "This is sufficiently long article content used only for validating the article slug field.",
        category: "Knowledge"
      }).success
    ).toBe(false));
  it("rejects short contact messages", () =>
    expect(
      contactSchema.safeParse({
        name: "Test",
        email: "a@example.com",
        subject: "Help",
        message: "Short"
      }).success
    ).toBe(false));
});

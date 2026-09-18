import { describe, expect, it } from "vitest";
import {
  slugify,
  escapeRegex,
  pageNumber,
  decodeArticleSlug
} from "../lib/utils";
import {
  articleSchema,
  articleUpdateSchema,
  quoteSchema,
  imageSourceSchema,
  taxonomySchema,
  duaSchema
} from "../lib/validation";
import { parseArticleContent } from "../lib/article-content";

describe("bilingual blog", () => {
  it("reads both encoded and decoded Bengali article paths", () => {
    const slug = "বাংলা-পরীক্ষামূলক-লেখা";
    expect(decodeArticleSlug(encodeURIComponent(slug))).toBe(slug);
    expect(decodeArticleSlug(slug)).toBe(slug);
    expect(decodeArticleSlug("%invalid")).toBeNull();
  });
  it("does not reset language, tags, image, or featured on a status-only update", () => {
    expect(articleUpdateSchema.parse({ status: "published" })).toEqual({
      status: "published"
    });
    expect(articleUpdateSchema.parse({ featured: false })).toEqual({
      featured: false
    });
  });
  it("preserves Bengali letters and vowel marks in slugs", () => {
    expect(slugify("  জ্ঞান অর্জনের অভ্যাস  ")).toBe("জ্ঞান-অর্জনের-অভ্যাস");
  });
  it("treats search syntax as literal text", () => {
    const query = "(জ্ঞান) .* [test] $";
    expect(new RegExp(escapeRegex(query), "i").test(query)).toBe(true);
    expect(new RegExp(escapeRegex(".*")).test("anything")).toBe(false);
  });
  it("bounds invalid pagination", () => {
    expect(pageNumber("NaN")).toBe(1);
    expect(pageNumber("-2")).toBe(1);
    expect(pageNumber("1000000")).toBe(10000);
  });
  it("accepts Bangla article content", () => {
    expect(
      articleSchema.safeParse({
        title: "জ্ঞান অর্জনের অভ্যাস",
        excerpt: "নিয়মিত পড়ার অভ্যাস গড়ে তোলার একটি সম্পাদকীয় আলোচনা।",
        content:
          "নির্ভরযোগ্য উৎস থেকে পড়া এবং নিজের ভাষায় নোট নেওয়া নিয়মিত অনুশীলনের অংশ।",
        category: "Knowledge",
        language: "bn",
        tags: ["পাঠাভ্যাস"]
      }).success
    ).toBe(true);
  });
  it("rejects executable or untrusted image URLs", () => {
    expect(imageSourceSchema.safeParse("javascript:alert(1)").success).toBe(
      false
    );
    expect(
      imageSourceSchema.safeParse("//untrusted.example/image.png").success
    ).toBe(false);
    expect(imageSourceSchema.safeParse("/images/blog-books.png").success).toBe(
      true
    );
    expect(
      imageSourceSchema.safeParse(
        "https://images.pexels.com/photos/7300898/pexels-photo-7300898.jpeg"
      ).success
    ).toBe(true);
    expect(
      imageSourceSchema.safeParse("https://i.ibb.co/example/article-image.jpg")
        .success
    ).toBe(true);
    expect(
      imageSourceSchema.safeParse("https://ibb.co/example/article-image.jpg")
        .success
    ).toBe(false);
    expect(
      imageSourceSchema.safeParse("http://i.ibb.co/example/article-image.jpg")
        .success
    ).toBe(false);
    expect(
      imageSourceSchema.safeParse("/api/media/123456789012345678901234").success
    ).toBe(true);
  });
  it("requires verification before publishing quotes", () => {
    const draft = {
      quote: "Test fixture only — not a religious quotation.",
      scholar: "Test author",
      source: "Test document",
      published: true,
      verified: false
    };
    expect(quoteSchema.safeParse(draft).success).toBe(false);
    expect(quoteSchema.safeParse({ ...draft, published: false }).success).toBe(
      true
    );
    expect(
      quoteSchema.safeParse({
        ...draft,
        verified: true,
        sourceUrl: "javascript:alert(1)"
      }).success
    ).toBe(false);
  });
  it("accepts Bengali categories without creating a second taxonomy model", () => {
    expect(
      taxonomySchema.safeParse({ name: "পাঠাভ্যাস", type: "tag" }).success
    ).toBe(true);
  });
  it("requires verification before a dua can be published", () => {
    const placeholder = {
      title: "TEST PLACEHOLDER Dua",
      arabicText: "[ADMIN MUST REPLACE]",
      banglaMeaning: "পরীক্ষার প্লেসহোল্ডার",
      category: "Testing",
      source: "Test fixture",
      reference: "TEST-ONLY",
      status: "published",
      verified: false,
      segments: []
    };
    expect(duaSchema.safeParse(placeholder).success).toBe(false);
    expect(
      duaSchema.safeParse({ ...placeholder, status: "draft" }).success
    ).toBe(true);
    expect(
      duaSchema.safeParse({ ...placeholder, verified: true }).success
    ).toBe(true);
  });
  it("renders only manually marked reference blocks with an explicit source", () => {
    expect(
      parseArticleContent(
        "Paragraph.\n\n> Test quotation, not religious content.\n> Source: Integration fixture"
      )
    ).toEqual([
      { type: "paragraph", text: "Paragraph." },
      {
        type: "quote",
        text: "Test quotation, not religious content.",
        source: "Integration fixture"
      }
    ]);
  });
});

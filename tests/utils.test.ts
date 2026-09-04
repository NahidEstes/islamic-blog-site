import { describe, expect, it } from "vitest";
import { estimateReadingTime, slugify } from "../lib/utils";
import { articleSchema, contactSchema, loginSchema } from "../lib/validation";

describe("content utilities", () => {
  it("creates predictable slugs", () =>
    expect(slugify("  Clear & Useful Title  ")).toBe("clear-useful-title"));
  it("never returns a zero-minute reading time", () =>
    expect(estimateReadingTime("short")).toBe(1));
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

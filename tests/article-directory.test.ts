import { describe, expect, it } from "vitest";
import {
  articleSort,
  articlesUrl,
  mapCategoryCounts,
  paginationRange,
  parseArticleDirectoryQuery,
  splitEditorialArticles
} from "../lib/article-directory";

describe("article directory query behavior", () => {
  it("parses, bounds, and normalizes shareable filters", () => {
    expect(
      parseArticleDirectoryQuery({
        q: "  বাংলা search  ",
        category: "Reflection",
        locale: "bn",
        sort: "oldest",
        page: "3"
      })
    ).toMatchObject({
      q: "বাংলা search",
      category: "Reflection",
      locale: "bn",
      sort: "oldest",
      page: 3
    });
    expect(
      parseArticleDirectoryQuery({
        locale: "invalid",
        sort: "random",
        page: "-5"
      })
    ).toMatchObject({ locale: "", sort: "newest", page: 1 });
  });

  it("maps every supported sort to a stable database order", () => {
    expect(articleSort("newest")).toEqual({ publishedAt: -1, _id: -1 });
    expect(articleSort("oldest")).toEqual({ publishedAt: 1, _id: 1 });
    expect(articleSort("most-read")).toMatchObject({ viewCount: -1 });
    expect(articleSort("most-liked")).toMatchObject({ likeCount: -1 });
  });

  it("preserves active filters while changing pages", () => {
    const query = parseArticleDirectoryQuery({
      q: "study",
      category: "Knowledge",
      locale: "en",
      sort: "most-read",
      page: "2",
      tag: "Sources"
    });
    expect(articlesUrl(query, { page: 3 })).toBe(
      "/articles?q=study&category=Knowledge&locale=en&sort=most-read&page=3&tag=Sources"
    );
    expect(paginationRange(6, 12)).toEqual([4, 5, 6, 7, 8]);
  });
});

describe("article directory mapping", () => {
  it("never repeats lead stories in the remaining grid", () => {
    const result = splitEditorialArticles(["a", "b", "c", "d", "e"]);
    expect(result).toEqual({
      lead: "a",
      secondary: ["b", "c"],
      more: ["d", "e"]
    });
    expect(splitEditorialArticles([])).toEqual({
      lead: null,
      secondary: [],
      more: []
    });
  });

  it("maps real category counts, excludes empty topics, and limits the directory", () => {
    expect(
      mapCategoryCounts(
        [
          { id: "1", name: "Knowledge", slug: "knowledge" },
          { id: "2", name: "Empty", slug: "empty" }
        ],
        [
          { name: "Reflection", count: 2 },
          { name: "Knowledge", count: 4 }
        ]
      )
    ).toEqual([
      {
        id: "1",
        name: "Knowledge",
        slug: "knowledge",
        description: "",
        count: 4
      },
      {
        id: "Reflection",
        name: "Reflection",
        slug: "Reflection",
        description: "",
        count: 2
      }
    ]);
  });
});

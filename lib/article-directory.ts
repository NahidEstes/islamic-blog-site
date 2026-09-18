import { pageNumber } from "./utils";

export type ArticleSort = "newest" | "oldest" | "most-read" | "most-liked";

type RawQuery = Record<string, string | string[] | undefined>;

export type ArticleDirectoryQuery = {
  q: string;
  category: string;
  locale: "" | "en" | "bn";
  sort: ArticleSort;
  page: number;
  tag: string;
  author: string;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parseArticleDirectoryQuery(
  query: RawQuery
): ArticleDirectoryQuery {
  const sortValue = first(query.sort);
  const localeValue = first(query.locale);
  return {
    q: first(query.q).trim().slice(0, 120),
    category: first(query.category).trim().slice(0, 80),
    locale: localeValue === "en" || localeValue === "bn" ? localeValue : "",
    sort: ["newest", "oldest", "most-read", "most-liked"].includes(sortValue)
      ? (sortValue as ArticleSort)
      : "newest",
    page: pageNumber(first(query.page)),
    tag: first(query.tag).trim().slice(0, 80),
    author: first(query.author).trim().slice(0, 80)
  };
}

export function articleSort(sort: ArticleSort): Record<string, 1 | -1> {
  if (sort === "oldest") return { publishedAt: 1, _id: 1 };
  if (sort === "most-read") return { viewCount: -1, publishedAt: -1, _id: -1 };
  if (sort === "most-liked") return { likeCount: -1, publishedAt: -1, _id: -1 };
  return { publishedAt: -1, _id: -1 };
}

export function articlesUrl(
  query: ArticleDirectoryQuery,
  changes: Partial<ArticleDirectoryQuery> = {}
) {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.locale) params.set("locale", next.locale);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.tag) params.set("tag", next.tag);
  if (next.author) params.set("author", next.author);
  const value = params.toString();
  return value ? `/articles?${value}` : "/articles";
}

export function splitEditorialArticles<T>(items: T[]) {
  return {
    lead: items[0] ?? null,
    secondary: items.slice(1, 3),
    more: items.slice(3)
  };
}

export function paginationRange(current: number, total: number) {
  if (total <= 1) return [];
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function mapCategoryCounts(
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>,
  counts: Array<{ name: string; count: number }>,
  limit = 6
) {
  const directory = new Map(
    categories.map((category) => [category.name, { ...category, count: 0 }])
  );
  for (const item of counts) {
    const current = directory.get(item.name);
    directory.set(item.name, {
      id: current?.id ?? item.name,
      name: item.name,
      slug: current?.slug ?? item.name,
      description: current?.description ?? "",
      count: item.count
    });
  }
  return [...directory.values()]
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

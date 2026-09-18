import { cache } from "react";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { Article } from "@/models/Article";
import { Taxonomy } from "@/models/Taxonomy";
import { Quote } from "@/models/Quote";
import { SiteSetting } from "@/models/Site";
import { User } from "@/models/User";
import { demoArticles } from "@/data/demo";
import { escapeRegex, pageNumber, decodeArticleSlug } from "@/lib/utils";
import type { ArticleCardData } from "@/types";
import {
  articleSort,
  mapCategoryCounts,
  type ArticleSort
} from "@/lib/article-directory";
import { Types } from "mongoose";

export const defaultSite = {
  name: "Ilm Bangla",
  description: "Thoughtful Islamic articles in Bangla and English.",
  contactEmail: "",
  footerText:
    "A quiet space for thoughtful Islamic reading. Learn carefully. Reflect deeply."
};

export function normalizeSiteBrand(site: typeof defaultSite) {
  return site.name.trim().toLowerCase() === "noor al-hidayah"
    ? { ...site, name: "Ilm Bangla" }
    : site;
}

export const defaultHomepage = {
  introHeading: "Assalamu alaikum wa rahmatullah.",
  introText:
    "Thoughtful reading for a life rooted in faith. Explore ideas, nurture understanding, and grow in knowledge.",
  newsletterHeading: "A little knowledge, in your inbox.",
  newsletterText: "New articles and thoughtful reading. No clutter.",
  featuredSlug: ""
};
export const getSettings = cache(async () => {
  if (!isDatabaseConfigured())
    return { site: defaultSite, homepage: defaultHomepage };
  await connectToDatabase();
  const rows = await SiteSetting.find({
    key: { $in: ["site", "homepage"] }
  }).lean();
  const site = {
    ...defaultSite,
    ...rows.find((r) => r.key === "site")?.value
  } as typeof defaultSite;
  return {
    site: normalizeSiteBrand(site),
    homepage: {
      ...defaultHomepage,
      ...rows.find((r) => r.key === "homepage")?.value
    }
  } as { site: typeof defaultSite; homepage: typeof defaultHomepage };
});
export function toCard(item: Record<string, unknown>): ArticleCardData {
  const author = item.author;
  const authorName =
    author && typeof author === "object" && "name" in author
      ? String(author.name)
      : "";
  return {
    id: String(item._id ?? ""),
    title: String(item.title),
    slug: String(item.slug),
    excerpt: String(item.excerpt),
    category: String(item.category),
    publishedAt: new Date(
      String(item.publishedAt ?? item.createdAt ?? "2026-08-18")
    ).toISOString(),
    readingTime: Number(item.readingTime ?? 1),
    featuredImage: String(item.featuredImage || "/images/blog-books.png"),
    featured: Boolean(item.featured),
    language: item.locale === "bn" ? "bn" : "en",
    tags: (item.tags ?? []) as string[],
    viewCount: Number(item.viewCount ?? 0),
    likeCount: Number(item.likeCount ?? 0),
    authorName
  };
}

type ArticleListResult = {
  items: ArticleCardData[];
  total: number;
  page: number;
  pages: number;
  demo: boolean;
};

export async function listArticles(
  options: {
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
    limit?: number;
    popular?: boolean;
    author?: string;
    locale?: string;
    sort?: ArticleSort;
  } = {}
): Promise<ArticleListResult> {
  const page = pageNumber(options.page);
  const limit = options.limit ?? 12;
  if (!isDatabaseConfigured()) {
    const all = demoArticles.filter(
      (a) =>
        !options.author &&
        (!options.q ||
          (a.title + " " + a.excerpt + " " + (a.content ?? ""))
            .toLowerCase()
            .includes(options.q.toLowerCase())) &&
        (!options.category || a.category === options.category) &&
        (!options.tag || a.tags?.includes(options.tag)) &&
        (!options.locale || a.language === options.locale)
    );
    const selectedSort = options.popular
      ? "most-read"
      : (options.sort ?? "newest");
    const sorted = [...all].sort((a, b) => {
      if (selectedSort === "oldest")
        return a.publishedAt.localeCompare(b.publishedAt);
      if (selectedSort === "most-read")
        return (
          (b.viewCount ?? 0) - (a.viewCount ?? 0) ||
          b.publishedAt.localeCompare(a.publishedAt)
        );
      if (selectedSort === "most-liked")
        return (
          (b.likeCount ?? 0) - (a.likeCount ?? 0) ||
          b.publishedAt.localeCompare(a.publishedAt)
        );
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    return {
      items: sorted.slice((page - 1) * limit, page * limit),
      total: all.length,
      page,
      pages: Math.ceil(all.length / limit),
      demo: true
    };
  }
  await connectToDatabase();
  const filter: Record<string, unknown> = { status: "published" };
  if (options.q) {
    const regex = {
      $regex: escapeRegex(options.q.slice(0, 120)),
      $options: "i"
    };
    filter.$or = [
      ...["title", "excerpt", "searchText", "category", "tags"].map(
        (field) => ({ [field]: regex })
      ),
      {
        $and: [{ contentFormat: { $ne: "rich-html" } }, { content: regex }]
      }
    ];
  }
  if (options.category) filter.category = options.category;
  if (options.tag) filter.tags = options.tag;
  if (options.locale === "en" || options.locale === "bn")
    filter.locale = options.locale;
  if (options.author) {
    if (!/^[a-f\d]{24}$/i.test(options.author))
      return { items: [], total: 0, page, pages: 0, demo: false };
    filter.author = options.author;
  }
  const selectedSort = options.popular
    ? "most-read"
    : (options.sort ?? "newest");
  if (selectedSort === "most-liked") {
    const aggregateFilter = { ...filter } as Record<string, unknown>;
    if (typeof aggregateFilter.author === "string")
      aggregateFilter.author = new Types.ObjectId(aggregateFilter.author);
    const [result] = await Article.aggregate([
      { $match: aggregateFilter },
      {
        $lookup: {
          from: "articlelikes",
          localField: "_id",
          foreignField: "article",
          as: "likes"
        }
      },
      { $addFields: { likeCount: { $size: "$likes" } } },
      { $sort: articleSort("most-liked") },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
              }
            },
            { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                likes: 0,
                "author.email": 0,
                "author.passwordHash": 0
              }
            }
          ],
          total: [{ $count: "value" }]
        }
      }
    ]);
    const total = Number(result?.total?.[0]?.value ?? 0);
    return {
      items: (result?.items ?? []).map(toCard),
      total,
      page,
      pages: Math.ceil(total / limit),
      demo: false
    };
  }
  const [rows, total] = await Promise.all([
    Article.find(filter)
      .sort(articleSort(selectedSort))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "author", select: "name" })
      .lean(),
    Article.countDocuments(filter)
  ]);
  return {
    items: rows.map(toCard),
    total,
    page,
    pages: Math.ceil(total / limit),
    demo: false
  };
}

export async function getPopularArticles(limit = 3) {
  if (!isDatabaseConfigured())
    return [...demoArticles]
      .filter((article) => Number(article.viewCount ?? 0) > 0)
      .sort(
        (a, b) =>
          Number(b.viewCount ?? 0) - Number(a.viewCount ?? 0) ||
          b.publishedAt.localeCompare(a.publishedAt)
      )
      .slice(0, limit);
  await connectToDatabase();
  const rows = await Article.find({
    status: "published",
    viewCount: { $gt: 0 }
  })
    .sort({ viewCount: -1, publishedAt: -1 })
    .limit(limit)
    .populate({ path: "author", select: "name" })
    .lean();
  return rows.map(toCard);
}

export async function getCategoryDirectory(limit = 6) {
  if (!isDatabaseConfigured()) {
    const categories = await getTaxonomies("category");
    const counts = categories.map((category) => ({
      name: category.name,
      count: demoArticles.filter(
        (article) => article.category === category.name
      ).length
    }));
    return mapCategoryCounts(categories, counts, limit);
  }
  await connectToDatabase();
  const [categories, counts] = await Promise.all([
    getTaxonomies("category"),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ])
  ]);
  return mapCategoryCounts(
    categories,
    counts.map((item) => ({
      name: String(item._id),
      count: Number(item.count)
    })),
    limit
  );
}
export const getArticle = cache(async (slug: string) => {
  const decodedSlug = decodeArticleSlug(slug);
  if (decodedSlug === null) return null;
  if (!isDatabaseConfigured()) {
    const a = demoArticles.find((a) => a.slug === decodedSlug);
    return a
      ? {
          ...a,
          id: "",
          content: a.content ?? a.excerpt,
          contentFormat: "plain" as const,
          seoTitle: "",
          metaDescription: "",
          author: null
        }
      : null;
  }
  await connectToDatabase();
  const a = await Article.findOne({
    slug: decodedSlug,
    status: "published"
  }).lean();
  const author = a?.author
    ? await User.findById(a.author).select("name bio").lean()
    : null;
  return a
    ? {
        ...toCard(a),
        content: String(a.content),
        contentFormat:
          a.contentFormat === "rich-html"
            ? ("rich-html" as const)
            : ("plain" as const),
        seoTitle: String(a.seoTitle ?? ""),
        metaDescription: String(a.metaDescription ?? ""),
        author: author
          ? {
              id: String(author._id),
              name: String(author.name),
              bio: String(author.bio ?? "")
            }
          : null
      }
    : null;
});

// Published articles only. Prefer shared topics, then recent reading;
// never recommend the article the visitor is already reading.
export async function getArticleReading(article: ArticleCardData) {
  const categories = await getTaxonomies("category");
  if (!isDatabaseConfigured()) {
    const others = demoArticles.filter((a) => a.slug !== article.slug);
    const related = [...others].sort(
      (a, b) =>
        Number(b.category === article.category) -
        Number(a.category === article.category)
    );
    return {
      related: related.slice(0, 3),
      recommended: related[3] ?? related[0] ?? null,
      popular: others.slice(0, 4),
      categories: categories.map((c) => ({
        ...c,
        count: demoArticles.filter((a) => a.category === c.name).length
      }))
    };
  }
  await connectToDatabase();
  const filter = { status: "published", slug: { $ne: article.slug } };
  const [related, popular, counts] = await Promise.all([
    Article.aggregate([
      { $match: filter },
      {
        $addFields: {
          relevance: {
            $add: [
              {
                $cond: [
                  { $eq: ["$category", { $literal: article.category }] },
                  2,
                  0
                ]
              },
              {
                $size: {
                  $setIntersection: [
                    { $ifNull: ["$tags", []] },
                    { $literal: article.tags ?? [] }
                  ]
                }
              }
            ]
          }
        }
      },
      { $sort: { relevance: -1, publishedAt: -1, _id: -1 } },
      { $limit: 4 }
    ]),
    Article.find(filter)
      .sort({ viewCount: -1, publishedAt: -1 })
      .limit(4)
      .lean(),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ])
  ]);
  const cards = related.map(toCard);
  return {
    related: cards.slice(0, 3),
    recommended: cards[3] ?? cards[0] ?? null,
    popular: popular.map(toCard),
    categories: categories.map((c) => ({
      ...c,
      count: Number(counts.find((r) => r._id === c.name)?.count ?? 0)
    }))
  };
}
export async function getTaxonomies(type: "category" | "tag", q = "") {
  if (!isDatabaseConfigured())
    return [
      ...new Set(
        demoArticles.flatMap((a) =>
          type === "category" ? [a.category] : (a.tags ?? [])
        )
      )
    ]
      .filter((name) => name.toLowerCase().includes(q.toLowerCase()))
      .map((name) => ({ id: name, name, description: "", slug: name }));
  await connectToDatabase();
  const rows = await Taxonomy.find({
    type,
    ...(q
      ? { name: { $regex: escapeRegex(q.slice(0, 120)), $options: "i" } }
      : {})
  })
    .sort({ name: 1 })
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: String(r.name),
    description: String(r.description ?? ""),
    slug: String(r.slug)
  }));
}
export async function getQuotes(limit = 12) {
  if (!isDatabaseConfigured()) return [];
  await connectToDatabase();
  return Quote.find({ published: true, verified: true, isDemo: { $ne: true } })
    .sort({ featured: -1, updatedAt: -1 })
    .limit(limit)
    .lean();
}

export async function getFeaturedArticle() {
  if (!isDatabaseConfigured())
    return demoArticles.find((a) => a.featured) ?? null;
  await connectToDatabase();
  const article = await Article.findOne({ status: "published", featured: true })
    .sort({ publishedAt: -1 })
    .lean();
  return article ? toCard(article) : null;
}

import { cache } from "react";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { decodeArticleSlug } from "@/lib/utils";
import { Dua, DuaProgress, LearnCategory } from "@/models/Learn";

export const learningModules = [
  {
    slug: "duas",
    title: "Duas",
    description: "Learn verified duas through meaning and guided practice."
  },
  {
    slug: "quran",
    title: "Quran",
    description: "A foundation for future verified Quran learning content."
  },
  {
    slug: "hadith",
    title: "Hadith",
    description: "A place for carefully sourced Hadith learning."
  },
  {
    slug: "arabic-stories",
    title: "Arabic Stories",
    description: "Build understanding through short Arabic reading."
  },
  {
    slug: "vocabulary",
    title: "Vocabulary",
    description: "Learn useful Arabic words in small steps."
  },
  {
    slug: "practice",
    title: "Practice",
    description: "Review completed learning and strengthen recall."
  }
] as const;

const commonDuaCategories = [
  "Morning",
  "Evening",
  "Sleeping",
  "Knowledge",
  "Protection",
  "Forgiveness"
];

function toDua(item: Record<string, unknown>) {
  const dateValue = item.publishedAt ?? item.createdAt;
  const parsedDate =
    dateValue instanceof Date ? dateValue : new Date(String(dateValue ?? ""));
  const publishedAt = Number.isNaN(parsedDate.getTime())
    ? new Date(0).toISOString()
    : parsedDate.toISOString();

  return {
    id: String(item._id ?? ""),
    title: String(item.title ?? ""),
    slug: String(item.slug ?? ""),
    arabicText: String(item.arabicText ?? ""),
    banglaMeaning: String(item.banglaMeaning ?? ""),
    transliteration: String(item.transliteration ?? ""),
    category: String(item.category ?? ""),
    source: String(item.source ?? ""),
    reference: String(item.reference ?? ""),
    sourceUrl: String(item.sourceUrl ?? ""),
    audioUrl: String(item.audioUrl ?? ""),
    featured: Boolean(item.featured),
    verified: Boolean(item.verified),
    status: String(item.status ?? "draft"),
    segments: (
      (item.segments ?? []) as Array<{
        arabicPhrase: string;
        transliteration?: string;
        banglaMeaning: string;
        order: number;
      }>
    )
      .map((segment) => ({
        arabicPhrase: String(segment.arabicPhrase),
        transliteration: String(segment.transliteration ?? ""),
        banglaMeaning: String(segment.banglaMeaning),
        order: Number(segment.order)
      }))
      .sort((a, b) => a.order - b.order),
    publishedAt
  };
}
export type DuaData = ReturnType<typeof toDua>;

export async function getLearnOverview() {
  if (!isDatabaseConfigured())
    return { featured: [], recent: [], counts: {} as Record<string, number> };
  await connectToDatabase();
  const filter = { status: "published", verified: true };
  const [featured, recent, duaCount] = await Promise.all([
    Dua.find({ ...filter, featured: true })
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean(),
    Dua.find(filter).sort({ publishedAt: -1 }).limit(5).lean(),
    Dua.countDocuments(filter)
  ]);
  return {
    featured: featured.map(toDua),
    recent: recent.map(toDua),
    counts: { duas: duaCount } as Record<string, number>
  };
}

export async function getDuaCategories() {
  if (!isDatabaseConfigured())
    return commonDuaCategories.map((name) => ({
      name,
      slug: name.toLowerCase(),
      description: "",
      count: 0
    }));
  await connectToDatabase();
  const [managed, counts] = await Promise.all([
    LearnCategory.find({ module: "duas", published: true })
      .sort({ order: 1, name: 1 })
      .lean(),
    Dua.aggregate([
      { $match: { status: "published", verified: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ])
  ]);
  const names = managed.length
    ? managed.map((category) => String(category.name))
    : commonDuaCategories;
  return names.map((name) => ({
    name,
    slug:
      String(managed.find((category) => category.name === name)?.slug) ||
      name.toLowerCase(),
    description: String(
      managed.find((category) => category.name === name)?.description ?? ""
    ),
    count: Number(counts.find((row) => row._id === name)?.count ?? 0)
  }));
}

export async function getDuasPage(userId?: string, category?: string) {
  const categories = await getDuaCategories();
  if (!isDatabaseConfigured())
    return { featured: null, popular: [], continueLearning: [], categories };
  await connectToDatabase();
  const filter = { status: "published", verified: true };
  const listFilter = category ? { ...filter, category } : filter;
  const [featured, popular, progress] = await Promise.all([
    Dua.findOne({ ...filter, featured: true })
      .sort({ publishedAt: -1 })
      .lean(),
    Dua.aggregate([
      { $match: listFilter },
      {
        $lookup: {
          from: "duaprogresses",
          localField: "_id",
          foreignField: "dua",
          as: "learnerProgress"
        }
      },
      { $addFields: { popularity: { $size: "$learnerProgress" } } },
      { $sort: { popularity: -1, featured: -1, publishedAt: -1 } },
      { $limit: 6 },
      { $project: { learnerProgress: 0 } }
    ]),
    userId
      ? DuaProgress.find({
          user: userId,
          status: { $in: ["in-progress", "completed"] }
        })
          .sort({ lastAccessedAt: -1 })
          .limit(5)
          .populate({
            path: "dua",
            match: filter,
            select: "title slug category segments"
          })
          .lean()
      : []
  ]);
  return {
    featured: featured ? toDua(featured) : null,
    popular: popular.map(toDua),
    continueLearning: progress
      .filter((item) => item.dua)
      .map((item) => {
        const dua = toDua(item.dua as unknown as Record<string, unknown>);
        return {
          ...dua,
          currentStep: Number(item.currentStep ?? 0),
          progressStatus: String(item.status),
          favorite: Boolean(item.favorite),
          percent: dua.segments.length
            ? Math.round(
                (Number(item.currentStep ?? 0) / dua.segments.length) * 100
              )
            : item.status === "completed"
              ? 100
              : 0
        };
      }),
    categories
  };
}

export const getDua = cache(async (slug: string, includeDraft = false) => {
  const decoded = decodeArticleSlug(slug);
  if (decoded === null || !isDatabaseConfigured()) return null;
  await connectToDatabase();
  const row = await Dua.findOne({
    slug: decoded,
    ...(includeDraft ? {} : { status: "published", verified: true })
  }).lean();
  return row ? toDua(row) : null;
});

export async function getDuaProgress(duaId: string, userId?: string) {
  if (!userId || !isDatabaseConfigured())
    return { currentStep: 0, status: "not-started", favorite: false };
  await connectToDatabase();
  const row = await DuaProgress.findOne({ user: userId, dua: duaId }).lean();
  return {
    currentStep: Number(row?.currentStep ?? 0),
    status: String(row?.status ?? "not-started"),
    favorite: Boolean(row?.favorite)
  };
}

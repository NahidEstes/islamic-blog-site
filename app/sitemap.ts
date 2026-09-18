import type { MetadataRoute } from "next";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { Article } from "@/models/Article";
import { Dua } from "@/models/Learn";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/articles",
    "/learn",
    "/learn/duas",
    "/categories",
    "/tags",
    "/quotes",
    "/about",
    "/contact"
  ].map((route) => ({
    url: base + route,
    changeFrequency: "weekly" as const,
    priority: route ? 0.7 : 1
  }));
  if (!isDatabaseConfigured()) return routes;
  await connectToDatabase();
  const [articles, duas] = await Promise.all([
    Article.find({ status: "published" })
      .select("slug updatedAt")
      .limit(44000)
      .lean(),
    Dua.find({ status: "published", verified: true })
      .select("slug updatedAt")
      .limit(1000)
      .lean()
  ]);
  return [
    ...routes,
    ...articles.map((a) => ({
      url: base + "/articles/" + encodeURIComponent(a.slug),
      lastModified: a.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6
    })),
    ...duas.map((dua) => ({
      url: base + "/learn/duas/" + encodeURIComponent(dua.slug),
      lastModified: dua.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}

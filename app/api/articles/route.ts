import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { articleSchema } from "@/lib/validation";
import { estimateReadingTime, pageNumber, slugify } from "@/lib/utils";
import { authorize, apiError, HttpError } from "@/lib/api";
import { Article } from "@/models/Article";
import { ActivityLog } from "@/models/Site";
import { ensureTopics } from "@/lib/editorial";
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") ?? "published";
    if (status !== "published") {
      const user = await getSession();
      if (!user || !isAdmin(user.role))
        throw new HttpError(403, "Not authorized.");
    }
    if (!["all", "draft", "published", "archived"].includes(status))
      throw new HttpError(400, "Invalid status.");
    await connectToDatabase();
    const page = pageNumber(request.nextUrl.searchParams.get("page"));
    const filter = status === "all" ? {} : { status };
    const [items, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .lean(),
      Article.countDocuments(filter)
    ]);
    return NextResponse.json({
      items,
      total,
      page,
      pages: Math.ceil(total / 20)
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request, true);
    const { language, ...data } = articleSchema.parse(await request.json());
    const base = slugify(data.title) || "article";
    await ensureTopics(data.category, data.tags);
    let slug = base;
    let suffix = 2;
    while (await Article.exists({ slug })) slug = base + "-" + suffix++;
    const article = await Article.create({
      ...data,
      locale: language,
      slug,
      author: user.id,
      readingTime: estimateReadingTime(data.content),
      publishedAt: data.status === "published" ? new Date() : undefined
    });
    await ActivityLog.create({
      actor: user.id,
      action: "article.created",
      entityType: "Article",
      entityId: article._id
    });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

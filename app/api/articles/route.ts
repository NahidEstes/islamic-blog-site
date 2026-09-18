import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { articleSchema } from "@/lib/validation";
import { pageNumber, slugify } from "@/lib/utils";
import {
  estimateArticleReadingTime,
  prepareArticleContent
} from "@/lib/article-html";
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
    const {
      language,
      slug: requestedSlug,
      ...data
    } = articleSchema.parse(await request.json());
    const prepared = prepareArticleContent(data.content, data.contentFormat);
    if (prepared.tooShort)
      throw new HttpError(
        400,
        "Article content must contain at least 50 visible characters."
      );
    if (prepared.tooLong)
      throw new HttpError(
        400,
        "Article content is too long after formatting is cleaned."
      );
    const slug = requestedSlug ?? slugify(data.title);
    if (!slug)
      throw new HttpError(
        400,
        "Enter a slug or a title containing letters or numbers."
      );
    if (await Article.exists({ slug }))
      throw new HttpError(409, "An article with this slug already exists.");
    await ensureTopics(data.category, data.tags);
    const article = await Article.create({
      ...data,
      content: prepared.content,
      searchText: prepared.visibleText,
      locale: language,
      slug,
      author: user.id,
      readingTime: estimateArticleReadingTime(
        prepared.content,
        data.contentFormat
      ),
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

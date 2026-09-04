import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { articleUpdateSchema } from "@/lib/validation";
import { estimateReadingTime } from "@/lib/utils";
import { Article } from "@/models/Article";
import { Bookmark, ActivityLog } from "@/models/Site";
import { ArticleLike, Comment } from "@/models/Interaction";
import { ensureTopics } from "@/lib/editorial";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await authorize(request, true);
    const id = checkedId((await params).id);
    const { language, ...data } = articleUpdateSchema.parse(
      await request.json()
    );
    const article = await Article.findById(id);
    if (!article) throw new HttpError(404, "Article not found.");
    article.set(data);
    if (language) article.locale = language;
    if (data.content) article.readingTime = estimateReadingTime(data.content);
    if (data.status === "published" && !article.publishedAt)
      article.publishedAt = new Date();
    article.archivedAt = article.status === "archived" ? new Date() : undefined;
    await article.save();
    await ensureTopics(article.category, article.tags);
    await ActivityLog.create({
      actor: user.id,
      action: "article." + article.status,
      entityType: "Article",
      entityId: id
    });
    return NextResponse.json({ article });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    await authorize(request, true);
    const id = checkedId((await params).id);
    if (!(await Article.findByIdAndDelete(id)))
      throw new HttpError(404, "Article not found.");
    await Promise.all([
      Bookmark.deleteMany({ contentType: "article", contentId: id }),
      ArticleLike.deleteMany({ article: id }),
      Comment.deleteMany({ article: id })
    ]);
    return NextResponse.json({ message: "Article deleted." });
  } catch (error) {
    return apiError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { authorize, apiError, checkedId, HttpError } from "@/lib/api";
import { articleUpdateSchema } from "@/lib/validation";
import {
  estimateArticleReadingTime,
  prepareArticleContent,
  type ArticleContentFormat
} from "@/lib/article-html";
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
    const storedFormat: ArticleContentFormat =
      article.contentFormat === "rich-html" ? "rich-html" : "plain";
    if (
      data.contentFormat &&
      data.contentFormat !== storedFormat &&
      data.content === undefined
    )
      throw new HttpError(
        400,
        "Include the article content when changing its format."
      );
    if (data.content !== undefined) {
      const nextFormat = data.contentFormat ?? storedFormat;
      const prepared = prepareArticleContent(data.content, nextFormat);
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
      data.content = prepared.content;
      data.contentFormat = nextFormat;
      article.searchText = prepared.visibleText;
      article.readingTime = estimateArticleReadingTime(
        prepared.content,
        nextFormat
      );
    }
    article.set(data);
    if (language) article.locale = language;
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

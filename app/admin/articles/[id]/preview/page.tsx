import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { connectToDatabase } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Article } from "@/models/Article";

export default async function PreviewArticlePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectToDatabase();
  const article = await Article.findById(id).lean();
  if (!article) notFound();
  const language = article.locale === "bn" ? "bn" : "en";
  const contentFormat =
    article.contentFormat === "rich-html" ? "rich-html" : "plain";

  return (
    <div className="article-editor-page article-editor-preview-page">
      <header className="article-editor-header">
        <div>
          <p className="article-editor-breadcrumb">
            Articles <span aria-hidden="true">/</span> Private Preview
          </p>
          <h1>Article Preview</h1>
          <p>This preview is visible only inside the protected admin area.</p>
        </div>
        <Link
          className="button button-outline"
          href={`/admin/articles/${id}/edit`}
        >
          <ArrowLeft size={16} /> Back to editor
        </Link>
      </header>

      <article className="article-editor-preview-card" lang={language}>
        <div className="article-editor-preview-meta">
          <span>{article.category}</span>
          <span>{article.status}</span>
          {article.publishedAt && (
            <span>
              <CalendarDays size={14} /> {formatDate(article.publishedAt)}
            </span>
          )}
        </div>
        <h1>{article.title}</h1>
        <p className="article-editor-preview-excerpt">{article.excerpt}</p>
        {article.featuredImage && (
          <div className="article-editor-preview-image">
            <Image
              src={article.featuredImage}
              alt=""
              fill
              sizes="(max-width: 900px) 92vw, 850px"
            />
          </div>
        )}
        <ArticleBody
          content={String(article.content)}
          contentFormat={contentFormat}
        />
      </article>
    </div>
  );
}

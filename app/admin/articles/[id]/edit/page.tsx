import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Article } from "@/models/Article";
import { getTaxonomies } from "@/lib/blog";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { sanitizeArticleHtml } from "@/lib/article-html";
export default async function EditArticle({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await connectToDatabase();
  const article = await Article.findById(id).lean();
  if (!article) notFound();
  const contentFormat =
    article.contentFormat === "rich-html" ? "rich-html" : "plain";
  const categories = await getTaxonomies("category");
  const tags = await getTaxonomies("tag");
  return (
    <>
      <div className="admin-title">
        <h1>Edit article</h1>
      </div>
      <ArticleEditor
        initial={JSON.parse(
          JSON.stringify({
            ...article,
            content:
              contentFormat === "rich-html"
                ? sanitizeArticleHtml(String(article.content))
                : article.content,
            contentFormat,
            language: article.locale ?? "en"
          })
        )}
        categories={categories.map((c) => c.name)}
        tags={tags.map((t) => t.name)}
      />
    </>
  );
}
